/** The complete, deliberately small grammar used by both the editor and reader. */
export type NoteFormat = "plain" | "md-lite-v1";
export type Inline = { type: "text" | "strong"; text: string } | { type: "break" };
export type Block = { type: "paragraph"; content: Inline[] } | { type: "section_heading"; content: Inline[] }
  | { type: "bullet_list"; items: Inline[][] } | { type: "ordered_list"; items: Inline[][] };
export type NoteDocument = { blocks: Block[]; supported: boolean };

const MAX_SOURCE = 65_536;
const listLine = (line: string) => /^- /.test(line) ? { type: "bullet_list" as const, text: line.slice(2) }
  : /^([1-9]\d*)\. /.test(line) ? { type: "ordered_list" as const, text: line.replace(/^[1-9]\d*\. /, "") }
  : null;

function inline(source: string): Inline[] {
  const result: Inline[] = [];
  let text = "", marked = "", inside = false;
  const flush = () => { if (text) { result.push({ type: "text", text }); text = ""; } };
  for (let i = 0; i < source.length;) {
    if (source[i] === "\\" && i + 1 < source.length) { if(inside)marked += source[i + 1]; else text += source[i + 1]; i += 2; continue; }
    if (source.startsWith("**", i)) {
      if (inside && marked) { flush(); result.push({ type: "strong", text: marked }); marked = ""; inside = false; }
      else if (inside) marked += "**";
      else inside = true;
      i += 2; continue;
    }
    if(inside)marked += source[i++]; else text += source[i++];
  }
  if(inside)text += `**${marked}`;
  flush();
  return result;
}

function escapeText(value: string) { return value.replace(/[\\*]/g, "\\$&"); }
function escapeLineStart(value: string) {
  return /^(?:## |-|[1-9]\d*\. )/.test(value) ? `\\${value}` : value;
}
function inlineSource(parts: Inline[]) {
  return parts.map(part => part.type === "break" ? "\\\n" : part.type === "strong" ? `**${escapeText(part.text)}**` : escapeText(part.text)).join("");
}

export function parseNote(contentFormat: string, content: string): NoteDocument {
  if (typeof content !== "string" || content.length > MAX_SOURCE) throw new Error("NOTE_SOURCE_LIMIT");
  if (contentFormat !== "plain" && contentFormat !== "md-lite-v1") {
    return { blocks: [{ type: "paragraph", content: [{ type: "text", text: content }] }], supported: false };
  }
  if (contentFormat === "plain") {
    return { blocks: content.split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] })), supported: true };
  }
  const lines = content.split("\n"), blocks: Block[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) { blocks.push({ type: "section_heading", content: inline(line.slice(3)) }); continue; }
    const list = listLine(line);
    if (list && (list.type !== "ordered_list" || line.startsWith("1. "))) {
      const items: Inline[][] = [inline(list.text)];
      let expected = 2;
      while (i + 1 < lines.length) {
        const next = listLine(lines[i + 1]);
        if (!next || next.type !== list.type || (list.type === "ordered_list" && !lines[i + 1].startsWith(`${expected}. `))) break;
        i++; expected++; items.push(inline(next.text));
      }
      blocks.push({ type: list.type, items }); continue;
    }
    const parts = inline(line);
    while ((lines[i]?.match(/\\+$/)?.[0].length ?? 0) % 2 === 1 && i + 1 < lines.length) {
      // A terminal backslash represents a hard break within the same paragraph.
      const last = parts.at(-1);
      if (last?.type === "text" && last.text.endsWith("\\")) last.text = last.text.slice(0, -1);
      parts.push({ type: "break" }, ...inline(lines[++i]));
    }
    blocks.push({ type: "paragraph", content: parts });
  }
  return { blocks, supported: true };
}

export function serializeNote(doc: NoteDocument): string {
  return doc.blocks.map(block => {
    if (block.type === "bullet_list" || block.type === "ordered_list")
      return block.items.map((item, index) => `${block.type === "bullet_list" ? "-" : `${index + 1}.`} ${inlineSource(item)}`).join("\n");
    const source = inlineSource(block.content);
    return block.type === "section_heading" ? `## ${source}` : escapeLineStart(source);
  }).join("\n");
}

export function visibleText(doc: NoteDocument): string {
  const content = (parts: Inline[]) => parts.map(part => part.type === "break" ? "\n" : part.text).join("");
  return doc.blocks.map(block => block.type === "bullet_list" || block.type === "ordered_list"
    ? block.items.map(content).join("\n") : content(block.content)).join("\n");
}

export function noteVisibleText(contentFormat: string, content: string): string {
  try { return visibleText(parseNote(contentFormat, content)); }
  catch { return content; }
}

export function escapePlain(plain: string): string | null {
  if (plain.includes("\r")) return null;
  const source = serializeNote(parseNote("plain", plain));
  return visibleText(parseNote("md-lite-v1", source)) === plain ? source : null;
}
