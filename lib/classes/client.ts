export const classCacheKey = (userId: string) => `ipagell-class-agenda-v1:${userId}`;
export class ClassRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function classRequest<T>(userId: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-IPagell-Account": userId, ...init?.headers },
  });
  const value = await response.json() as T & { error?: string };
  if (!response.ok) {
    if (response.status === 401) {
      try { localStorage.removeItem(classCacheKey(userId)); } catch { /* Storage may be unavailable. */ }
      window.dispatchEvent(new CustomEvent("ipagell-class-session-ended", { detail: userId }));
    }
    throw new ClassRequestError(value.error ?? "Operazione non riuscita. Riprova.", response.status);
  }
  return value as T;
}
