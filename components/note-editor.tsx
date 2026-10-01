"use client";
import { useEffect, useRef, useState } from "react";
import { Schema, type Node as PMNode, type Mark } from "prosemirror-model";
import { EditorState, type SelectionBookmark } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, setBlockType, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { escapePlain, parseNote, serializeNote, visibleText, type Block, type Inline, type NoteDocument, type NoteFormat } from "@/lib/notes/format";
import { useI18n } from "@/components/i18n-provider";
import { headingSelection,toolbarSelection,toggleNoteList } from "@/lib/notes/editor-selection";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block", parseDOM: [{ tag: "p" }], toDOM: () => ["p", 0] },
    section_heading: { content: "inline*", group: "block", parseDOM: [{ tag: "h2" }], toDOM: () => ["h2", 0] },
    bullet_list: { content: "list_item+", group: "block", toDOM: () => ["ul", 0] },
    ordered_list: { content: "list_item+", group: "block", toDOM: () => ["ol", 0] },
    list_item: { content: "paragraph", toDOM: () => ["li", 0] },
    text: { group: "inline" },
    hard_break: { inline: true, group: "inline", selectable: false, toDOM: () => ["br"] },
  },
  marks: { strong: { parseDOM: [{ tag: "strong" }, { tag: "b" }], toDOM: () => ["strong", 0] } },
});
function fromInline(parts: Inline[]): PMNode[] {
  return parts.flatMap(part => part.type === "break" ? [schema.nodes.hard_break.create()] : part.text ? [schema.text(part.text, part.type === "strong" ? [schema.marks.strong.create()] : [])] : []);
}
function fromDocument(document: NoteDocument): PMNode {
  const blocks = document.blocks.map(block => {
    if (block.type === "bullet_list" || block.type === "ordered_list")
      return schema.nodes[block.type].create(null, block.items.map(item => schema.nodes.list_item.create(null, schema.nodes.paragraph.create(null, fromInline(item)))));
    return schema.nodes[block.type].create(null, fromInline(block.content));
  });
  return schema.nodes.doc.create(null, blocks.length ? blocks : [schema.nodes.paragraph.create()]);
}
function toInline(node: PMNode): Inline[] {
  const parts: Inline[] = [];
  node.forEach(child => {
    if (child.type === schema.nodes.hard_break) { parts.push({ type: "break" }); return; }
    if (!child.isText || !child.text) return;
    const type = child.marks.some((mark: Mark) => mark.type === schema.marks.strong) ? "strong" : "text";
    const last = parts.at(-1);
    if (last && last.type === type) last.text += child.text;
    else parts.push({ type, text: child.text });
  });
  return parts;
}
function toDocument(node: PMNode): NoteDocument {
  const blocks: Block[] = [];
  node.forEach(child => {
    if (child.type === schema.nodes.bullet_list || child.type === schema.nodes.ordered_list) {
      const items: Inline[][] = [];
      child.forEach(item => items.push(toInline(item.firstChild ?? item)));
      blocks.push({ type: child.type.name as "bullet_list" | "ordered_list", items } as Block);
    } else blocks.push({ type: child.type === schema.nodes.section_heading ? "section_heading" : "paragraph", content: toInline(child) });
  });
  return { blocks, supported: true };
}

export type NoteEditorValue = { contentFormat: NoteFormat; content: string };
export default function NoteEditor({ value, onChange, disabled = false, label }: { value: NoteEditorValue; onChange: (value: NoteEditorValue) => void; disabled?: boolean; label: string }) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null), callback = useRef(onChange);
  const mode = useRef<NoteFormat>(value.contentFormat), current = useRef(value.content), composing = useRef(false), pending = useRef<(() => void) | null>(null);
  const selectionBeforeCommand=useRef<SelectionBookmark|null>(null),rejected=useRef(false);
  const [menu, setMenu] = useState(false), [error, setError] = useState("");
  const [formatState,setFormatState]=useState({bold:false,heading:false});
  useEffect(()=>{callback.current=onChange;},[onChange]);
  useEffect(() => {
    if (!host.current || view.current || value.contentFormat !== "plain" && value.contentFormat !== "md-lite-v1" || value.content.includes("\r")) return;
    const editor = new EditorView(host.current, {
      state: EditorState.create({
        schema, doc: fromDocument(parseNote(value.contentFormat, value.content)),
        plugins: [history(), keymap({
          "Mod-b": toggleMark(schema.marks.strong), "Mod-z": undo, "Mod-Shift-z": redo, "Mod-y": redo,
          "Enter": splitListItem(schema.nodes.list_item), "Mod-[": liftListItem(schema.nodes.list_item),
          "Shift-Enter": (state, dispatch) => { if (dispatch) dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create())); return true; },
        }), keymap(baseKeymap)],
      }),
      dispatchTransaction(transaction) {
        const next = editor.state.apply(transaction);
        const doc = toDocument(next.doc);
        const content = mode.current === "plain" ? visibleText(doc) : serializeNote(doc);
        if ([...content].length > 20_000) { rejected.current=true;setError(t("notes.contentLimit"));editor.updateState(editor.state);return; }
        setError("");
        if(selectionBeforeCommand.current)selectionBeforeCommand.current=selectionBeforeCommand.current.map(transaction.mapping);
        editor.updateState(next);
        const marks=next.storedMarks??next.selection.$from.marks();
        setFormatState({bold:next.selection.empty?marks.some(mark=>mark.type===schema.marks.strong):next.doc.rangeHasMark(next.selection.from,next.selection.to,schema.marks.strong),heading:headingSelection(next)});
        if(composing.current)return;
        if (content !== current.current) { current.current = content; callback.current({ contentFormat: mode.current, content }); }
      },
      handlePaste(view, event) {
        const raw = event.clipboardData?.getData("text/plain") || (() => {
          const html = event.clipboardData?.getData("text/html") ?? "";
          if (!html) return "";
          const inert = new DOMParser().parseFromString(html, "text/html");
          inert.querySelectorAll("script,style,svg,img,iframe").forEach(node => node.remove());
          return inert.body.textContent ?? "";
        })();
        if (!raw) { setError(t("notes.pasteEmpty")); return true; }
        view.dispatch(view.state.tr.insertText(raw)); return true;
      },
      attributes: { "aria-label": label, role:"textbox", "aria-multiline":"true", spellcheck: "true" },
      editable:()=>!disabled,
    });
    view.current = editor;
    editor.dom.addEventListener("compositionstart", onCompositionStart);
    editor.dom.addEventListener("compositionend", onCompositionEnd);
    function onCompositionStart() { composing.current = true; }
    function onCompositionEnd() { composing.current = false; queueMicrotask(()=>{
      const content=mode.current==="plain"?visibleText(toDocument(editor.state.doc)):serializeNote(toDocument(editor.state.doc));
      if(content!==current.current){current.current=content;callback.current({contentFormat:mode.current,content});}
      const nextCommand=pending.current;pending.current=null;if(nextCommand)nextCommand();
    }); }
    return () => { editor.destroy(); view.current = null; };
    // A note editor is keyed by note ID: a parent save never rebuilds its selection/history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{view.current?.setProps({editable:()=>!disabled});},[disabled]);
  const command = (run: (editor: EditorView) => void,formatting=true) => {
    const apply = () => {
      const editor = view.current;
      if (!editor || disabled) return;
      const originalState=editor.state,originalMode=mode.current,originalContent=current.current;
      rejected.current=false;
      try{
        const bookmark=selectionBeforeCommand.current;selectionBeforeCommand.current=null;
        const selection=toolbarSelection(editor.state,bookmark);
        if(!selection.eq(editor.state.selection))editor.dispatch(editor.state.tr.setSelection(selection));
        if (formatting && mode.current === "plain") {
          const converted = escapePlain(current.current);
          if (converted === null) { setError(t("notes.plainConversionFailed")); return; }
          mode.current = "md-lite-v1";
        }
        run(editor);
        if(rejected.current){mode.current=originalMode;current.current=originalContent;editor.updateState(originalState);return;}
        const content = mode.current==="plain"?visibleText(toDocument(editor.state.doc)):serializeNote(toDocument(editor.state.doc));
        if (content !== current.current || mode.current !== value.contentFormat) { current.current = content; callback.current({ contentFormat: mode.current, content }); }
        setMenu(false);setError("");
      }catch{
        mode.current=originalMode;current.current=originalContent;editor.updateState(originalState);setError(t("notes.formatFailed"));
      }finally{editor.focus();}
    };
    if (composing.current) pending.current = apply; else apply();
  };
  const run = (fn: ReturnType<typeof toggleMark>,formatting=true) => command(editor => fn(editor.state, editor.dispatch, editor),formatting);
  const preserveSelection=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(disabled)return;
    selectionBeforeCommand.current=view.current?.state.selection.getBookmark()??null;
    // Keep the keyboard and native selection on touch; mouse fallback below
    // also covers browsers that move focus on the compatibility mouse event.
    event.preventDefault();
  };
  if (value.contentFormat !== "plain" && value.contentFormat !== "md-lite-v1") return <pre className="notes-unsupported">{value.content}</pre>;
  if (value.contentFormat === "plain" && value.content.includes("\r")) return <><textarea aria-label={label} value={value.content} disabled={disabled} rows={14} onChange={event => callback.current({ contentFormat: "plain", content: event.target.value })}/><p>{t("notes.plainConversionFailed")}</p></>;
  return <div className="visual-note-editor">
    <div className="visual-note-toolbar" role="toolbar" aria-label={t("notes.formatting")} onPointerDown={preserveSelection} onMouseDown={event=>event.preventDefault()} onKeyDown={event=>{if(event.key==="Escape"){setMenu(false);view.current?.focus();}}}>
      <button type="button" disabled={disabled} aria-pressed={formatState.bold} aria-label={t("notes.bold")} title={t("notes.bold")} onClick={() => run(toggleMark(schema.marks.strong))}><b>B</b></button>
      <button type="button" disabled={disabled} aria-pressed={formatState.heading} aria-label={t("notes.sectionHeading")} title={t("notes.sectionHeading")} onClick={() => command(editor=>{
        setBlockType(headingSelection(editor.state)?schema.nodes.paragraph:schema.nodes.section_heading)(editor.state,editor.dispatch,editor);
      })}>H₂</button>
      <button type="button" disabled={disabled} aria-label={t("notes.list")} aria-expanded={menu} onClick={() => setMenu(!menu)}>≡ ▾</button>
      <button type="button" disabled={disabled} aria-label={t("notes.undo")} onClick={() => run(undo,false)}>↶</button>
      <button type="button" disabled={disabled} aria-label={t("notes.redo")} onClick={() => run(redo,false)}>↷</button>
      {menu && <div className="visual-note-list-menu"><button type="button" disabled={disabled} onClick={() => run(toggleNoteList(schema.nodes.bullet_list))}>{t("notes.bulletList")}</button><button type="button" disabled={disabled} onClick={() => run(toggleNoteList(schema.nodes.ordered_list))}>{t("notes.numberedList")}</button></div>}
    </div>
    <div ref={host} className="visual-note-surface" aria-disabled={disabled} onKeyDown={event => { if (event.key === "Escape" && menu) { setMenu(false); view.current?.focus(); } }} />
    {error && <p className="notes-error" role="alert">{error}</p>}
  </div>;
}
