export class RequestError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

// HTTP failures (including gateway HTML or malformed JSON) are not network
// failures. In particular a 401 must never become an offline login.
export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, cache: "no-store", credentials: "same-origin",
    signal: init?.signal ?? AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  let value: T & { error?: string; code?: string };
  try {
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error();
    value = await response.json();
    if (!value || typeof value !== "object") throw new Error();
  } catch {
    throw new RequestError(response.ok ? 502 : response.status, "Risposta del server non valida. Riprova online.");
  }
  if (!response.ok)
    throw new RequestError(response.status, typeof value.error === "string" ? value.error : "Operazione non riuscita. Riprova.", value.code);
  return value;
}
