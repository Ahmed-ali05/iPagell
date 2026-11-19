import { Backend, Engine, SamplerType, loadLiteRtLm, type Message } from "@litert-lm/core";
import { SYSTEM_PROMPT, proposalExchange, proposalPrompt, proposalPromptV2, parseProposal, type Section } from "./proposals";
import { sourceFromText } from "./source";
import { guardFetch } from "./network";
// This entry point accepts a model and a variant, NEVER caller-provided text.
// Only final content of this fixed synthetic fixture may leave this worker.
console.log = console.info = console.warn = console.error = () => {};
const requests = guardFetch(false);
const text = "Il DNS traduce nomi di dominio in indirizzi IP. La cache DNS conserva temporaneamente le risposte fino al TTL.";
const chunk = { id: "s1", documentId: "synthetic-dns", page: 1, start: 0, end: text.length, text };
const section: Section = { id: "s1", language: "it", chunk };
self.onmessage = async ({ data }) => {
  let engine: Engine | undefined;
  const progress = (stage: string) => self.postMessage({ jobId: data.jobId, type: "progress", stage });
  try {
    const start = performance.now(); progress("runtime"); await loadLiteRtLm(new URL("/runtime/", self.location.origin).href);
    const runtimeMs = performance.now() - start, loadStart = performance.now();
    engine = await Engine.create({ model: data.file.stream(), backend: Backend.GPU_ARTISAN, mainExecutorSettings: { maxNumTokens: 4096 }, benchmarkEnabled: true });
    const loadMs = performance.now() - loadStart;
    const variant = data.variant as string;
    if (!["legacy", "minimal-legacy", "minimal-direct", "minimal-example", "full-example", "full-constrained", "production-example", "production-canonical", "production-alias"].includes(variant)) throw Error("VARIANT");
    const selectedChunk = ["production-canonical","production-alias"].includes(variant) ? (await sourceFromText(text,"Synthetic DNS")).chunks[0] : chunk;
    const selectedSection: Section = {...section,id:selectedChunk.id,chunk:selectedChunk};
    const full = variant === "legacy" || variant.startsWith("full") || variant.startsWith("production-");
    const example = variant.includes("example") || variant === "full-constrained";
    const minimalExample = { title: "DNS", summary: "Il DNS traduce nomi di dominio in indirizzi IP.", sources: ["s1"] };
    const fullExample = { version: "study-proposals-v1", nodes: [{ id: "p1", ...minimalExample, action: "new", target: null }], edges: [] };
    const system = full ? SYSTEM_PROMPT : 'Extract ONE concept in Italian using only CURRENT. Return ONLY a JSON object with title, summary, sources (exact source ID). Preserve negation. No Markdown or extra text.';
    const prompt = full ? proposalPrompt(section, [], [chunk]) : JSON.stringify({ CURRENT: { id: "s1", text }, task: "One concept with one source" });
    const exchange=proposalExchange(selectedSection,[],[selectedChunk]);
    const user = variant === "production-alias" ? exchange.prompt : variant.startsWith("production-") ? proposalPromptV2(selectedSection,[],[selectedChunk]) : prompt + (example ? `\nValid output example for this synthetic source: ${JSON.stringify(full ? fullExample : minimalExample)}` : "");
    const legacy = variant === "legacy" || variant === "minimal-legacy";
    progress("section-start"); const prefillStart = performance.now();
    const chat = await engine.createConversation({ preface: { messages: [{ role: "system", content: system }, ...(legacy ? [{ role: "user", content: user }] : [])], extra_context: { enable_thinking: false } }, prefillPrefaceOnInit: true, filterChannelContentFromKvCache: true, enableConstrainedDecoding: variant === "full-constrained", sessionConfig: { maxOutputTokens: 1024, samplerParams: { type: SamplerType.TOP_K, k: 1, temperature: 0, seed: 42 } } });
    const prefillMs = performance.now() - prefillStart;
    const generationStart = performance.now(), message: Message = await chat.sendMessage(legacy ? "JSON" : { role: "user", content: user });
    const sendMs = performance.now() - generationStart, benchmark = await chat.getBenchmarkInfo();
    const raw = typeof message.content === "string" ? message.content : message.content?.map(c => c.type === "text" ? c.text : "[NON_TEXT]").join("") ?? "";
    let validation = "valid", parsed: unknown;
    try {
      parsed = variant === "production-alias" ? exchange.parse(raw) : full ? parseProposal(raw, selectedSection, [], [selectedChunk]) : JSON.parse(raw);
      if (!full) { const p = parsed as typeof minimalExample; if (Object.keys(p).sort().join() !== "sources,summary,title" || typeof p.title !== "string" || typeof p.summary !== "string" || JSON.stringify(p.sources) !== '["s1"]') throw Error("MINIMAL_SCHEMA"); }
    } catch (e) { validation = e instanceof Error ? e.message : "INVALID"; }
    const result = { source: text, sourceId: selectedChunk.id, runtimeMs, loadMs, prefillMs, sendMs, benchmark, totalTokens: await chat.getTokenCount(), outputCapReached: benchmark.lastDecodeTokenCount >= 1024, messageKeys: Object.keys(message), role: message.role, contentType: typeof message.content, channelLengths: Object.fromEntries(Object.entries(message.channels ?? {}).map(([k,v]) => [k,v.length])), raw, validation, parsed, requests, repairMs: 0, repairs: 0 };
    await chat.delete(); self.postMessage({ jobId: data.jobId, type: "result", result });
  } catch { self.postMessage({ jobId: data.jobId, type: "error", code: "DIAGNOSTIC_RUNTIME", message: "Runtime sintetico interrotto." }); }
  finally { await engine?.delete().catch(() => {}); }
};
