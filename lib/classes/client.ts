import { requestJson, RequestError } from "../client-http";

export const classCacheKey = (userId: string) => `ipagell-class-agenda-v1:${userId}`;
export class ClassRequestError extends RequestError {
  constructor(message: string, status: number) { super(status, message); }
}
export async function classRequest<T>(userId: string, path: string, init?: RequestInit): Promise<T> {
  try {
    return await requestJson<T>(path, {
      ...init,
      headers: { ...init?.headers, "X-IPagell-Account": userId },
    });
  } catch (error) {
    if (!(error instanceof RequestError)) throw error;
    if (error.status === 401) {
      try { localStorage.removeItem(classCacheKey(userId)); } catch { /* Storage may be unavailable. */ }
      window.dispatchEvent(new CustomEvent("ipagell-class-session-ended", { detail: userId }));
    }
    throw new ClassRequestError(error.message, error.status);
  }
}
