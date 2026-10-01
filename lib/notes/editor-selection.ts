import { AllSelection, TextSelection, type EditorState, type SelectionBookmark } from "prosemirror-state";
import type { Command } from "prosemirror-state";
import type { Node as ProseMirrorNode, NodeType } from "prosemirror-model";
import { liftListItem,wrapInList } from "prosemirror-schema-list";

// Toolbar commands keep the editor's selection even if a control takes focus.
// Block commands also need text positions for a browser Select All operation.
export function toolbarSelection(state:EditorState,bookmark:SelectionBookmark|null){
  const selection=bookmark?.resolve(state.doc)??state.selection;
  return selection instanceof AllSelection
    ?TextSelection.between(state.doc.resolve(0),state.doc.resolve(state.doc.content.size))
    :selection;
}

export function headingSelection(state:EditorState){
  if(state.selection.empty)return state.selection.$from.parent.type.name==="section_heading";
  let found=false,allHeadings=true;
  state.doc.nodesBetween(state.selection.from,state.selection.to,node=>{
    if(node.isTextblock){found=true;if(node.type.name!=="section_heading")allHeadings=false;}
  });
  return found&&allHeadings;
}

// The note format allows exactly one paragraph per list item. The generic
// list wrapper needs a looser schema for multi-paragraph selections, so build
// one item per selected block without allowing content the serializer drops.
export function toggleNoteList(listType:NodeType):Command{
  return (state,dispatch,view)=>{
    const {$from,$to}=state.selection;
    const {paragraph,list_item}=listType.schema.nodes;
    for(let depth=$from.depth;depth>0;depth--){
      const node=$from.node(depth);
      if(!["bullet_list","ordered_list"].includes(node.type.name)||depth>$to.depth||$to.node(depth)!==node)continue;
      if(node.type===listType){
        if(depth!==1)return liftListItem(list_item)(state,dispatch,view);
        if(!dispatch)return true;
        const startIndex=$from.index(depth),endIndex=$to.index(depth)+1,listPosition=$from.before(depth);
        const items=Array.from({length:node.childCount},(_,index)=>node.child(index));
        const before=startIndex?node.type.create(node.attrs,items.slice(0,startIndex)):null;
        const after=endIndex<items.length?node.type.create(node.attrs,items.slice(endIndex)):null;
        const paragraphs=items.slice(startIndex,endIndex).map(item=>item.firstChild!);
        const mapPosition=(position:number)=>{
          let oldPosition=listPosition+1+items.slice(0,startIndex).reduce((sum,item)=>sum+item.nodeSize,0);
          let newPosition=listPosition+(before?.nodeSize??0);
          for(let index=startIndex;index<endIndex;index++){
            if(position<=oldPosition+items[index].nodeSize-2)return newPosition+1+Math.max(0,position-oldPosition-2);
            oldPosition+=items[index].nodeSize;newPosition+=items[index].firstChild!.nodeSize;
          }
          return newPosition-1;
        };
        const transaction=state.tr.replaceWith(listPosition,listPosition+node.nodeSize,[...(before?[before]:[]),...paragraphs,...(after?[after]:[])]);
        transaction.setSelection(TextSelection.create(transaction.doc,mapPosition(state.selection.anchor),mapPosition(state.selection.head)));
        dispatch(transaction.scrollIntoView());return true;
      }
      if(dispatch)dispatch(state.tr.setNodeMarkup($from.before(depth),listType).scrollIntoView());
      return true;
    }
    const range=$from.blockRange($to);
    if(!range||range.depth!==0)return wrapInList(listType)(state,dispatch,view);
    const blocks:ProseMirrorNode[]=[];
    for(let index=range.startIndex;index<range.endIndex;index++){
      const node=range.parent.child(index);
      if(!node.isTextblock)return false;
      blocks.push(node);
    }
    if(!dispatch)return true;
    const items=blocks.map(node=>list_item.create(null,paragraph.create(null,node.content)));
    const mapPosition=(position:number)=>{
      let oldPosition=range.start,newPosition=range.start+1;
      for(let index=0;index<blocks.length;index++){
        if(position<=oldPosition+blocks[index].nodeSize-1)return newPosition+2+Math.max(0,position-oldPosition-1);
        oldPosition+=blocks[index].nodeSize;newPosition+=items[index].nodeSize;
      }
      return newPosition-2;
    };
    const transaction=state.tr.replaceWith(range.start,range.end,listType.create(null,items));
    transaction.setSelection(TextSelection.create(transaction.doc,mapPosition(state.selection.anchor),mapPosition(state.selection.head)));
    dispatch(transaction.scrollIntoView());return true;
  };
}
