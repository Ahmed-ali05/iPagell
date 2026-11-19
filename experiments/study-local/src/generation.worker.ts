import { Backend, Engine, SamplerType, loadLiteRtLm, type Conversation } from "@litert-lm/core";
import { GENERATION_LIMITS as L, GENERATION_PROMPT_VERSION, SYSTEM_PROMPT, proposalExchange, type Candidate, type Section, type Proposal } from "./proposals";
import { LabError, type SourceChunk } from "./source";
import { responseText, outputShape } from "./generation-response";
import { guardFetch } from "./network";

export type GenerationInput = { jobId: number; file: Blob; sections: Section[]; candidates: Candidate[][]; chunks: SourceChunk[]; mode: "none" | "embedding" };
export type SectionResult = { sectionId: string; proposal: Proposal | null; attempts: number; invalidOutputs: number; sourceTokens: number; prefaceTokens: number; outputTokens: number; ms: number; code?: string; validationFailures?: string[]; diagnostics?: { prefillMs: number; sendMs: number; validationMs: number; repair: boolean; shape: ReturnType<typeof outputShape>; benchmark: Awaited<ReturnType<Conversation["getBenchmarkInfo"]>> }[] };
export type GenerationResult = { mode: GenerationInput["mode"]; loadMs: number; results: SectionResult[]; requests: { method: string; url: string }[]; promptVersion: string };
console.log = console.info = console.warn = console.error = () => {};
const requests = guardFetch(false);
self.onmessage = async ({ data }: MessageEvent<GenerationInput>) => {
  let engine: Engine | undefined, conversation: Conversation | undefined, stage = "wasm";
  const started = performance.now();
  const progress = (stage: string, extra = {}) => self.postMessage({ jobId: data.jobId, type: "progress", stage, ...extra });
  try {
    progress("Caricamento runtime generativo locale");
    await loadLiteRtLm(new URL("/runtime/", self.location.origin).href);
    stage = "engine"; progress("Avvio Gemma E2B (limite 120 s)");
    engine = await Engine.create({ model: data.file.stream(), backend: Backend.GPU_ARTISAN, mainExecutorSettings: { maxNumTokens: L.contextTokens }, benchmarkEnabled: true });
    const loadMs = performance.now() - started, results: SectionResult[] = [];
    // Conversation prefill uses the tokenizer/template embedded in this exact file.
    // Count includes template overhead, so the source admission check is conservative.
    async function prefill(content: string, system?: string) {
      return engine!.createConversation({ preface: { messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content }], extra_context: { enable_thinking: false } },
        prefillPrefaceOnInit: true, filterChannelContentFromKvCache: true, enableConstrainedDecoding: false,
        sessionConfig: { maxOutputTokens: L.outputTokens, samplerParams: { type: SamplerType.TOP_K, k: 1, temperature: 0, seed: 42 } } });
    }
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i], candidates = data.candidates[i] ?? [], sectionStarted = performance.now();
      stage = "section"; progress("section-start", { done: i, total: data.sections.length, sectionId: section.id });
      let sourceTokens = 0, prefaceTokens = 0, outputTokens = 0, invalidOutputs = 0, proposal: Proposal | null = null, attempts = 0, code: string | undefined;
      const validationFailures: string[] = []; const diagnostics: NonNullable<SectionResult["diagnostics"]> = [];
      try {
        conversation = await prefill(section.chunk.text); sourceTokens = await conversation.getTokenCount(); await conversation.delete(); conversation = undefined;
        if (!Number.isSafeInteger(sourceTokens) || sourceTokens < 1 || sourceTokens > L.sourceTokens) throw new LabError("SOURCE_TOKENS", "Sezione oltre il budget tokenizer. Nessun troncamento.");
        for (let attempt = 0; attempt <= L.repairs; attempt++) {
          attempts++;
          const exchange = proposalExchange(section, candidates, data.chunks, attempt > 0);
          const prompt = exchange.prompt;
          const prefillStarted = performance.now();
          conversation = await prefill(prompt, SYSTEM_PROMPT);
          prefaceTokens = await conversation.getTokenCount();
          // Reserve 1024 output tokens plus 72 for template/counting differences.
          // The engine also has a hard 4096 cap; the real user prompt is not truncated.
          if (!Number.isSafeInteger(prefaceTokens) || prefaceTokens < 1 || prefaceTokens > 3000) throw new LabError("CONTEXT_TOKENS", "Contesto troppo ampio. Nessun candidato o testo viene troncato.");
          try {
            // Token admission uses a real prefill, then generation follows the documented
            // system-preface + one user-message API (no consecutive user JSON turn).
            await conversation.delete(); conversation = await engine.createConversation({ preface: { messages: [{role:"system",content:SYSTEM_PROMPT}], extra_context:{enable_thinking:false} }, prefillPrefaceOnInit:true, filterChannelContentFromKvCache:true, enableConstrainedDecoding:false, sessionConfig:{maxOutputTokens:L.outputTokens,samplerParams:{type:SamplerType.TOP_K,k:1,temperature:0,seed:42}} });
            const prefillMs=performance.now()-prefillStarted, sendStarted=performance.now();
            const message = await conversation.sendMessage({role:"user",content:prompt});
            const sendMs=performance.now()-sendStarted;
            const info = await conversation.getBenchmarkInfo(); outputTokens = info.lastDecodeTokenCount;
            const totalTokens = await conversation.getTokenCount();
            if (!Number.isSafeInteger(outputTokens) || outputTokens < 1 || outputTokens > L.outputTokens || totalTokens > L.contextTokens) throw new LabError("OUTPUT_TOKENS", "Budget token non verificabile o superato.");
            const raw=responseText(message), validationStarted=performance.now();
            const diagnostic={prefillMs,sendMs,validationMs:0,repair:attempt>0,shape:outputShape(raw,outputTokens,L.outputTokens),benchmark:info};
            diagnostics.push(diagnostic);
            try { proposal = exchange.parse(raw); } finally { diagnostic.validationMs=performance.now()-validationStarted; }
            break;
          } catch (error) {
            if (!(error instanceof LabError && error.code === "PROPOSAL_INVALID")) throw error;
            invalidOutputs++; code = "PROPOSAL_INVALID"; validationFailures.push(error.message);
          } finally { await conversation.delete(); conversation = undefined; }
        }
      } catch (error) {
        if (!(error instanceof LabError)) throw error; code = error.code;
      } finally { await conversation?.delete(); conversation = undefined; }
      const ms = performance.now() - sectionStarted;
      if (ms > L.sectionMs) { proposal = null; code = "SECTION_TIMEOUT"; }
      if (proposal) code = undefined;
      const result = { sectionId: section.id, proposal, attempts, invalidOutputs, sourceTokens, prefaceTokens, outputTokens, ms, ...(code ? { code } : {}), validationFailures, diagnostics };
      results.push(result);
      progress("section-complete", { result, done: i + 1, total: data.sections.length });
    }
    self.postMessage({ jobId: data.jobId, type: "result", result: { mode: data.mode, loadMs, results, requests, promptVersion: GENERATION_PROMPT_VERSION } satisfies GenerationResult });
  } catch (error) {
    self.postMessage({ jobId: data.jobId, type: "error", code: error instanceof LabError ? error.code : `GENERATOR_RUNTIME_${stage.toUpperCase()}`,
      message: error instanceof LabError ? error.message : `Generatore locale fermato nella fase ${stage}. Nessuna proposta applicata; mappa manuale e ricerca restano disponibili.` });
  } finally { await conversation?.delete().catch(() => {}); await engine?.delete().catch(() => {}); }
};
