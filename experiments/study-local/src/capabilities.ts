import { LabError } from "./source";
export type GpuProbe = { requestAdapter(): Promise<{ features: { has(name: string): boolean } } | null> };
export async function probeGpu(gpu: GpuProbe | undefined, secure: boolean) {
  if (!secure || !gpu) throw new LabError("MODEL_BACKEND", "WebGPU non disponibile in questo contesto. Usa la ricerca testuale, senza scaricare il modello.");
  const adapter = await gpu.requestAdapter();
  if (!adapter) throw new LabError("MODEL_BACKEND", "Nessun adattatore WebGPU disponibile. La ricerca testuale funziona senza modello.");
  return { workerGpuAdapter: true, shaderF16Available: adapter.features.has("shader-f16"), note: "API admission check; not a precision or device qualification" };
}
