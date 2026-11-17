import { probeGpu, type GpuProbe } from "./capabilities";
import { LabError } from "./source";
self.onmessage = async ({ data }: MessageEvent<{ jobId: number }>) => {
  try {
    const result = await probeGpu((navigator as unknown as { gpu?: GpuProbe }).gpu, isSecureContext);
    self.postMessage({ jobId: data.jobId, type: "result", result });
  } catch (error) {
    self.postMessage({ jobId: data.jobId, type: "error", code: error instanceof LabError ? error.code : "MODEL_BACKEND", message: error instanceof LabError ? error.message : "Verifica GPU non riuscita. Usa la ricerca testuale senza scaricare il modello." });
  }
};
