import { MODEL } from "./model";
import { GENERATOR } from "./generator-model";
import { LabError } from "./source";
export type NetworkEntry = { method: string; url: string };
export function allowedRequest(url: string, origin: string, method: string, body: boolean, model: boolean): boolean {
  const parsed = new URL(url, origin);
  if (!["GET", "HEAD"].includes(method.toUpperCase()) || body || parsed.username || parsed.password) return false;
  if (model && (parsed.href === MODEL.url || parsed.href === GENERATOR.url)) return true;
  return parsed.origin === origin && ["/assets/", "/runtime/", "/fixtures/"].some(path => parsed.pathname.startsWith(path)) && !parsed.search;
}
// Defence in depth for fetch calls, not a sandbox against malicious same-origin code.
// Script/module loading is constrained separately by CSP; it is not in this ledger.
export function guardFetch(model: boolean): NetworkEntry[] {
  const requests: NetworkEntry[] = [], nativeFetch = self.fetch.bind(self);
  self.fetch = async (input, init) => {
    const request = input instanceof Request ? input : undefined;
    const url = new URL(request?.url ?? String(input), self.location.origin).href;
    const method = init?.method ?? request?.method ?? "GET";
    if (!allowedRequest(url, self.location.origin, method, !!init?.body || !!request?.body, model))
      throw new LabError("NETWORK_BLOCKED", "Richiesta non prevista bloccata dal laboratorio.");
    requests.push({ method, url });
    return nativeFetch(input, { ...init, credentials: "omit", referrerPolicy: "no-referrer" });
  };
  return requests;
}
