import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { parseNote, type Inline } from "./format";

export type PdfNote = { title:string; subjectName:string; content:string; contentFormat:string; createdAt?:number; updatedAt:number; className?:string; authorName?:string };
export type FontLoader = (path:string)=>Promise<Uint8Array>;
const defaultLoad:FontLoader = async path => {
  const resources:Record<string,()=>Promise<{default:string}>>={
    "noto-sans-latin-400-normal.woff":()=>import("../../public/fonts/noto-sans-latin-400-normal.woff?inline"),
    "noto-sans-latin-700-normal.woff":()=>import("../../public/fonts/noto-sans-latin-700-normal.woff?inline"),
    "noto-sans-latin-ext-400-normal.woff":()=>import("../../public/fonts/noto-sans-latin-ext-400-normal.woff?inline"),
    "noto-sans-latin-ext-700-normal.woff":()=>import("../../public/fonts/noto-sans-latin-ext-700-normal.woff?inline"),
    "noto-sans-arabic-arabic-400-normal.woff":()=>import("../../public/fonts/noto-sans-arabic-arabic-400-normal.woff?inline"),
    "noto-sans-arabic-arabic-700-normal.woff":()=>import("../../public/fonts/noto-sans-arabic-arabic-700-normal.woff?inline"),
    "noto-sans-symbols-2-symbols-400-normal.woff":()=>import("../../public/fonts/noto-sans-symbols-2-symbols-400-normal.woff?inline"),
    "noto-emoji-emoji-400-normal.woff":()=>import("../../public/fonts/noto-emoji-emoji-400-normal.woff?inline"),
  };
  const resource=resources[path];if(!resource)throw new Error("PDF_FONT_UNAVAILABLE");
  const data=(await resource()).default;
  const base64=data.slice(data.indexOf(",")+1),binary=atob(base64);
  return Uint8Array.from(binary,char=>char.charCodeAt(0));
};
type FontInfo={name:string;font:PDFFont;chars:Set<number>};
type Run={text:string;font:FontInfo;strong:boolean};
type Line={runs:Run[];indent:number;size:number;height:number;gap:number;heading?:boolean};
const A4={width:595.28,height:841.89}, MARGIN=48, FOOTER=32;
const fontFiles=[
  "noto-sans-latin-400-normal.woff","noto-sans-latin-700-normal.woff",
  "noto-sans-latin-ext-400-normal.woff","noto-sans-latin-ext-700-normal.woff",
  "noto-sans-arabic-arabic-400-normal.woff","noto-sans-arabic-arabic-700-normal.woff",
  "noto-sans-symbols-2-symbols-400-normal.woff","noto-emoji-emoji-400-normal.woff",
];
function needsExtra(text:string){
  return {arabic:/[\u0600-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u.test(text),emoji:/[\u{1f000}-\u{1ffff}]/u.test(text),symbols:/[^\u0000-\u024f\u0600-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u.test(text)};
}
function splitTokens(text:string){return text.match(/\s+|\S+/gu)??[];}
function replaceUnsupported(char:string){return `[U+${char.codePointAt(0)!.toString(16).toUpperCase()}]`;}
function imageText(text:string){return /[^\u0000-\u024f]/u.test(text)&&typeof document!=="undefined";}
function rasterText(text:string,size:number,strong:boolean){
  const scale=3,canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("PDF_CANVAS_UNAVAILABLE");
  ctx.font=`${strong?700:400} ${size*scale}px system-ui, sans-serif`;
  const width=Math.max(1,ctx.measureText(text).width/scale+2);
  canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(size*1.7*scale);
  ctx.font=`${strong?700:400} ${size*scale}px system-ui, sans-serif`;
  ctx.fillStyle="#212938";ctx.direction=/[\u0590-\u08ff]/u.test(text)?"rtl":"ltr";
  ctx.textBaseline="alphabetic";ctx.fillText(text,0,size*1.25*scale);
  return {width,height:size*1.7,png:canvas.toDataURL("image/png")};
}
export async function generateNotePdf(note:PdfNote, load:FontLoader=defaultLoad):Promise<Uint8Array>{
  const document=parseNote(note.contentFormat,note.content);
  const allText=[note.title,note.subjectName,note.className,note.authorName,note.content].filter(Boolean).join("\n");
  const extras=needsExtra(allText);
  const paths=fontFiles.filter((_,index)=>index<4 || (extras.arabic&&index>=4&&index<=5) || (extras.symbols&&index===6) || (extras.emoji&&index===7));
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  pdf.setTitle(note.title);pdf.setSubject(note.subjectName);pdf.setCreator("iPagell");
  if(note.authorName)pdf.setAuthor(note.authorName);
  if(note.createdAt)pdf.setCreationDate(new Date(note.createdAt));
  pdf.setModificationDate(new Date(note.updatedAt));
  const fonts:FontInfo[]=await Promise.all(paths.map(async name=>{
    const bytes=await load(name);
    const parsed=fontkit.create(bytes);
    return {name,font:await pdf.embedFont(bytes,{subset:true}),chars:new Set<number>(parsed.characterSet)};
  }));
  const choose=(char:string,strong:boolean):FontInfo=>{
    const code=char.codePointAt(0)!;
    const candidates=fonts.filter(font=>font.chars.has(code)).sort((a,b)=>
      (code>=0x1f000&&code<=0x1ffff?Number(b.name.includes("emoji"))-Number(a.name.includes("emoji")):0));
    if(!candidates.length)return fonts[0];
    const preferred=strong?candidates.find(font=>font.name.includes("-700-")):candidates.find(font=>font.name.includes("-400-"));
    return preferred??candidates[0];
  };
  const runsFor=(text:string,strong:boolean):Run[]=>{
    const result:Run[]=[];
    for(const original of text){
      const candidate=choose(original,strong);
      const safe=candidate.chars.has(original.codePointAt(0)!)?original:replaceUnsupported(original);
      const font=safe===original?candidate:choose("[",strong);
      const previous=result.at(-1);
      if(previous?.font===font&&previous.strong===strong)previous.text+=safe;
      else result.push({text:safe,font,strong});
    }
    return result;
  };
  const runWidth=(run:Run,size:number)=>imageText(run.text)?rasterText(run.text,size,run.strong).width:run.font.font.widthOfTextAtSize(run.text,size);
  const width=(runs:Run[],size:number)=>runs.reduce((sum,run)=>sum+runWidth(run,size),0);
  const lines:Line[]=[];
  const wrap=(parts:Inline[],size:number,indent:number,gap:number,heading=false)=>{
    const max=A4.width-2*MARGIN-indent;
    let line:Run[]=[],lineWidth=0;
    const push=()=>{lines.push({runs:line,indent,size,height:size*1.42,gap,heading});line=[];lineWidth=0;};
    const add=(token:string,strong:boolean)=>{
      const runs=runsFor(token,strong),tokenWidth=width(runs,size);
      if(lineWidth+tokenWidth>max&&line.length){push();if(/^\s+$/u.test(token))return;}
      if(tokenWidth>max){for(const char of token){const pieces=runsFor(char,strong),w=width(pieces,size);if(lineWidth+w>max&&line.length)push();line.push(...pieces);lineWidth+=w;}return;}
      line.push(...runs);lineWidth+=tokenWidth;
    };
    for(const part of parts){
      if(part.type==="break"){push();continue;}
      for(const token of splitTokens(part.text))add(token,part.type==="strong");
    }
    push();
  };
  wrap([{type:"text",text:note.title}],21,0,12,true);
  const date=new Intl.DateTimeFormat("it",{day:"numeric",month:"long",year:"numeric"}).format(new Date(note.updatedAt));
  const metadata=[note.subjectName,note.className,note.authorName,date].filter(Boolean).join(" · ");
  wrap([{type:"text",text:metadata}],9,0,18);
  if(note.contentFormat==="plain"){
    for(const block of document.blocks){if(block.type==="paragraph")wrap(block.content,11,0,0);}
  }else for(const block of document.blocks){
    if(block.type==="section_heading")wrap(block.content,15,0,9,true);
    else if(block.type==="paragraph")wrap(block.content,11,0,7);
    else block.items.forEach((item,index)=>wrap([{type:"text",text:block.type==="bullet_list"?"•  ":`${index+1}.  `},...item],11,16,index===block.items.length-1?9:1));
  }
  let page:PDFPage=pdf.addPage([A4.width,A4.height]),y=A4.height-MARGIN;
  for(let index=0;index<lines.length;index++){
    const line=lines[index];
    const required=line.height+line.gap+(line.heading&&index+1<lines.length?lines[index+1].height:0);
    if(y-required<MARGIN+FOOTER){page=pdf.addPage([A4.width,A4.height]);y=A4.height-MARGIN;}
    y-=line.height;
    let x=MARGIN+line.indent;
    for(const run of line.runs){
      if(imageText(run.text)){
        const rendered=rasterText(run.text,line.size,run.strong);
        const png=await pdf.embedPng(rendered.png);
        page.drawImage(png,{x,y:y-line.size*.45,width:rendered.width,height:rendered.height});
      }else page.drawText(run.text,{x,y,size:line.size,font:run.font.font,color:rgb(0.13,0.16,0.22)});
      x+=runWidth(run,line.size);
    }
    y-=line.gap;
  }
  const numberFont=fonts[0].font;
  pdf.getPages().forEach((item,index)=>item.drawText(`${index+1} / ${pdf.getPageCount()}`,{x:A4.width-MARGIN-38,y:25,size:8,font:numberFont,color:rgb(0.4,0.43,0.48)}));
  return pdf.save();
}
