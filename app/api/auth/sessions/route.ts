import { z } from "zod";
import { database } from "@/lib/server/db";
import { checkMutation, errorResponse, json, readJson } from "@/lib/server/http";
import { identity, rateLimit, sessionTokenHash } from "@/lib/server/auth";
import { publicSessionId, SessionRepository } from "@/lib/server/session-repository";
export const dynamic = "force-dynamic";

const id = z.string().regex(/^[a-f0-9]{32}$/);
const schema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("revoke"), expectedUserId: z.string().max(100), id }).strict(),
  z.object({ operation: z.literal("revoke-others"), expectedUserId: z.string().max(100) }).strict(),
]);
const sessionRequired = () => json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);

// Lists the signed-in account's open sessions. No token hash ever leaves the server.
export async function GET(request: Request) {
  try {
    const user = await identity(request);
    const current = sessionTokenHash(request);
    if (!user || !current) return sessionRequired();
    return json({ sessions: await new SessionRepository(database()).list(user.id, current) });
  } catch (error) {
    return errorResponse(error);
  }
}

// Closes one other session, or every other one. Protective: no re-authentication.
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const user = await identity(request);
    const current = sessionTokenHash(request);
    if (!user || !current) return sessionRequired();
    const parsed = schema.safeParse(await readJson(request, 1024));
    if (!parsed.success)
      return json({ error: "Richiesta non valida. Ricarica la pagina.", code: "SESSIONS_INVALID_INPUT" }, 400);
    const input = parsed.data;
    if (input.expectedUserId !== user.id)
      return json({ error: "Account cambiato. Ricarica la pagina.", code: "ACCOUNT_CHANGED" }, 401);
    await rateLimit(request, user.id, "sessions");
    const sessions = new SessionRepository(database());
    if (input.operation === "revoke") {
      // This device signs out through the normal logout, which handles the local copy.
      if (input.id === publicSessionId(current))
        return json({ error: "Per uscire da questo dispositivo usa «Esci».", code: "SESSIONS_CURRENT" }, 400);
      return json({ revoked: await sessions.revoke(user.id, current, input.id) });
    }
    return json({ revoked: await sessions.revokeOthers(user.id, current) });
  } catch (error) {
    return errorResponse(error);
  }
}
