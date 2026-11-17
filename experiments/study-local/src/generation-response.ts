import type { Message } from "@litert-lm/core";
import { LabError } from "./source";
// Inspect final answer only. Never concatenate channels (which can contain thinking).
export function responseText(message: Message): string {
  if (message.role !== "assistant" || message.tool_calls?.length) throw new LabError("PROPOSAL_INVALID", "Proposta fuori contratto (MESSAGE_ROLE_OR_TOOL).");
  if (typeof message.content === "string") return message.content;
  if (!message.content?.length || message.content.some(c => c.type !== "text")) throw new LabError("PROPOSAL_INVALID", "Proposta fuori contratto (NON_TEXT_RESPONSE).");
  return message.content.map(c => c.type === "text" ? c.text : "").join("");
}
export function outputShape(raw: string, decodeTokens: number, cap: number) {
  const trimmed=raw.trim(), fenced=/^```(?:json)?\s*\n[\s\S]*\n```$/i.test(trimmed);
  const inner=fenced?trimmed.replace(/^```(?:json)?\s*\n/i,"").replace(/\n```$/,""):trimmed;
  let json=false, root="unparsed";
  try { const value=JSON.parse(inner);json=true;root=Array.isArray(value)?"array":value&&typeof value==="object"?"object":typeof value; } catch {}
  return { units:raw.length,envelope:fenced?"json-fence":trimmed.startsWith("{")?"bare-object":"extra-text-or-delimiter", jsonInsideEnvelope:json, root,
    outputCapReached:decodeTokens>=cap, possiblyTruncated:decodeTokens>=cap&&!json };
}
