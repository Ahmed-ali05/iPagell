export const MAX_BODY = 1_500_000;
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    },
  });
}
export function checkMutation(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Richiesta non consentita");
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "Formato non supportato");
}
export async function readJson(
  request: Request,
  limit = MAX_BODY,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit) {
    await request.body?.cancel();
    throw new HttpError(413, "Richiesta troppo grande");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Dati mancanti");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, "Richiesta troppo grande");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new HttpError(400, "JSON non valido");
  }
}
export function errorResponse(error: unknown) {
  if (!(error instanceof HttpError))
    console.error(
      "iPagell server failure",
      error instanceof Error
        ? { name: error.name, message: error.message }
        : "unknown",
    );
  return error instanceof HttpError
    ? json({ error: error.message }, error.status)
    : json(
        { error: "Servizio temporaneamente non disponibile. Riprova." },
        503,
      );
}
