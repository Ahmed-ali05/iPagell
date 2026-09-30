import type { ReactNode } from "react";
import { parseNote, type Inline } from "@/lib/notes/format";

function InlineText({ parts }: { parts: Inline[] }) {
  return <>{parts.map((part, index): ReactNode => part.type === "break" ? <br key={index} />
    : part.type === "strong" ? <strong key={index}>{part.text}</strong> : part.text)}</>;
}
export function NoteContent({ contentFormat, content }: { contentFormat: string; content: string }) {
  let document;
  try { document = parseNote(contentFormat, content); }
  catch { return <div className="notes-content notes-unsupported">{content}</div>; }
  if (!document.supported) return <div className="notes-content notes-unsupported">{content}</div>;
  if (contentFormat === "plain") return <div className="notes-content notes-plain">{content}</div>;
  return <div className="notes-content notes-rich">{document.blocks.map((block, index) => {
    if (block.type === "section_heading") return <h2 key={index}><InlineText parts={block.content} /></h2>;
    if (block.type === "bullet_list") return <ul key={index}>{block.items.map((item, i) => <li key={i}><InlineText parts={item} /></li>)}</ul>;
    if (block.type === "ordered_list") return <ol key={index}>{block.items.map((item, i) => <li key={i}><InlineText parts={item} /></li>)}</ol>;
    return <p key={index}><InlineText parts={block.content} /></p>;
  })}</div>;
}
