import assert from "node:assert/strict";
import test from "node:test";
import { Schema } from "prosemirror-model";
import { AllSelection,EditorState,TextSelection } from "prosemirror-state";
import { setBlockType,toggleMark } from "prosemirror-commands";
import { headingSelection,toolbarSelection,toggleNoteList } from "../lib/notes/editor-selection";

const schema=new Schema({nodes:{doc:{content:"block+"},paragraph:{content:"text*",group:"block"},section_heading:{content:"text*",group:"block"},bullet_list:{content:"list_item+",group:"block"},ordered_list:{content:"list_item+",group:"block"},list_item:{content:"paragraph"},text:{}},marks:{strong:{}}});
const block=(text:string,type="paragraph")=>schema.nodes[type].create(null,schema.text(text));

test("Select All can format every block as a list without dropping text",()=>{
  const doc=schema.nodes.doc.create(null,[block("Energia"),block("Si conserva")]);
  let state=EditorState.create({doc,selection:new AllSelection(doc)});
  state=state.apply(state.tr.setSelection(toolbarSelection(state,null)));
  assert.ok(state.selection instanceof TextSelection);
  assert.equal(toggleNoteList(schema.nodes.bullet_list)(state,tr=>{state=state.apply(tr);}),true);
  assert.equal(state.doc.firstChild?.type,schema.nodes.bullet_list);
  assert.equal(state.doc.firstChild?.childCount,2);
  assert.equal(state.doc.textContent,doc.textContent);
  assert.equal(state.doc.textBetween(state.selection.from,state.selection.to,"\n"),"Energia\nSi conserva");
  assert.equal(toggleNoteList(schema.nodes.ordered_list)(state,tr=>{state=state.apply(tr);}),true);
  assert.equal(state.doc.firstChild?.type,schema.nodes.ordered_list);
  assert.equal(toggleNoteList(schema.nodes.ordered_list)(state,tr=>{state=state.apply(tr);}),true);
  assert.equal(state.doc.childCount,2);
  assert.equal(state.doc.firstChild?.type,schema.nodes.paragraph);
  assert.equal(state.doc.textContent,doc.textContent);
});

test("section heading toggles back across a full note and preserves bold text",()=>{
  const doc=schema.nodes.doc.create(null,[block("Energia"),block("Si conserva")]);
  let state=EditorState.create({doc,selection:new AllSelection(doc)});
  state=state.apply(state.tr.setSelection(toolbarSelection(state,null)));
  const dispatch=(tr:Parameters<EditorState["apply"]>[0])=>{state=state.apply(tr);};
  toggleMark(schema.marks.strong)(state,dispatch);
  assert.equal(setBlockType(schema.nodes.section_heading)(state,dispatch),true);
  assert.equal(headingSelection(state),true);
  assert.equal(setBlockType(schema.nodes.paragraph)(state,dispatch),true);
  assert.equal(headingSelection(state),false);
  assert.equal(state.doc.textContent,doc.textContent);
  assert.ok(state.doc.rangeHasMark(state.selection.from,state.selection.to,schema.marks.strong));
});

test("a toolbar bookmark maps through an input composition and retains its range",()=>{
  const doc=schema.nodes.doc.create(null,block("Energia si conserva"));
  const state=EditorState.create({doc,selection:TextSelection.create(doc,1,8)});
  const bookmark=state.selection.getBookmark();
  const transaction=state.tr.insertText("La ",1);
  const next=state.apply(transaction);
  const selection=toolbarSelection(next,bookmark.map(transaction.mapping));
  assert.equal(next.doc.textBetween(selection.from,selection.to),"Energia");
  assert.equal(toolbarSelection(state,null).eq(state.selection),true);
});

test("removing a middle list item retains neighbouring items and a backward selection",()=>{
  const list=schema.nodes.bullet_list.create(null,["uno","due","tre"].map(text=>schema.nodes.list_item.create(null,block(text))));
  const doc=schema.nodes.doc.create(null,list);
  let state=EditorState.create({doc,selection:TextSelection.create(doc,13,10)});
  assert.equal(toggleNoteList(schema.nodes.bullet_list)(state,tr=>{state=state.apply(tr);}),true);
  assert.equal(state.doc.childCount,3);
  assert.equal(state.doc.child(0).type,schema.nodes.bullet_list);
  assert.equal(state.doc.child(1).type,schema.nodes.paragraph);
  assert.equal(state.doc.child(2).type,schema.nodes.bullet_list);
  assert.equal(state.doc.textContent,doc.textContent);
  assert.equal(state.doc.textBetween(state.selection.from,state.selection.to),"due");
  assert.ok(state.selection.anchor>state.selection.head);
});
