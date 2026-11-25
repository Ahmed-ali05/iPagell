import { z } from "zod";
import { passwordSchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { DUMMY_HASH, NO_PASSWORD, hashPassword, verifyPassword } from "@/lib/server/password";
import { identity, rateLimit, sessionCookie, sessionTokenHash } from "@/lib/server/auth";
import { AuthRepository } from "@/lib/server/auth-repository";
export const dynamic = "force-dynamic";

// What the security panel can offer this session: the sign-in method and, for
// accounts without a password, until when a Google confirmation is still valid.
export async function GET(request: Request) {
  try {
    const user = await identity(request);
    const sessionHash = sessionTokenHash(request);
    if (!user || !sessionHash) return json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);
    const auth = new AuthRepository(database());
    const mode = await auth.mode();
    const account = await auth.find(user.username, mode);
    if (!account) return json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);
    const google = account.password_hash === NO_PASSWORD;
    const reauthUntil = google ? await auth.activeGrant(account.id, account.auth_version, sessionHash, mode) : null;
    return json({ method: google ? "google" : "password", reauthUntil });
  } catch (error) {
    return errorResponse(error);
  }
}
const schema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("password"),
      expectedUserId: z.string().max(100),
      currentPassword: z.string().min(1).max(128),
      newPassword: passwordSchema,
    })
    .strict(),
  z
    .object({
      operation: z.literal("delete"),
      expectedUserId: z.string().max(100),
      // Absent for Google accounts, which consume a recent Google confirmation instead.
      currentPassword: z.string().min(1).max(128).optional(),
      confirmation: z.string().max(32),
    })
    .strict(),
]);
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);
    const parsed = schema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        {
          error:
            "Controlla i campi. La nuova password deve avere 12–128 caratteri.",
          code: "SECURITY_INVALID_INPUT",
        },
        400,
      );
    const input = parsed.data;
    if (input.expectedUserId !== user.id)
      return json({ error: "Account cambiato. Ricarica la pagina.", code: "ACCOUNT_CHANGED" }, 401);
    await rateLimit(request, user.username, "security");
    const db = database();
    const auth = new AuthRepository(db);
    const mode = await auth.mode();
    const account = await auth.find(user.username, mode);
    const sessionHash = sessionTokenHash(request);
    if (account && sessionHash && account.password_hash === NO_PASSWORD) {
      // Google account: no password to change; deletion consumes this session's
      // Google confirmation (checked here for the message, enforced in the batch).
      if (input.operation === "password")
        return json({ error: "Questo account accede con Google e non ha una password.", code: "SECURITY_NO_PASSWORD" }, 400);
      if (!(await auth.activeGrant(account.id, account.auth_version, sessionHash, mode)))
        return json({ error: "Per sicurezza conferma prima il tuo account Google, poi riprova.", code: "SECURITY_REAUTH_REQUIRED" }, 403);
    } else {
      const valid = await verifyPassword(input.currentPassword ?? "", account?.password_hash ?? DUMMY_HASH);
      if (!account || !account.password_hash || !sessionHash || !valid)
        return json({ error: "Password non valida.", code: "SECURITY_INVALID_PASSWORD" }, 401);
    }
    if (!account || !sessionHash)
      return json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);
    if (input.operation === "password") {
      const hash = await hashPassword(input.newPassword);
      const changed = await auth.replacePassword(account, hash, account.recovery_hash, mode, sessionHash);
      if (!changed)
        return json(
          { error: "Credenziali già cambiate. Accedi di nuovo.", code: "SECURITY_CREDENTIALS_CHANGED" },
          409,
        );
    } else {
      if (input.confirmation !== user.username)
        return json(
          { error: "Scrivi esattamente il tuo nome utente per confermare.", code: "SECURITY_CONFIRMATION_MISMATCH" },
          400,
        );
      const ownedClass = await db
        .prepare("SELECT name FROM classes WHERE owner_id=? LIMIT 1")
        .bind(user.id)
        .first<{ name: string }>();
      if (ownedClass)
        return json(
          {
            error: `Prima trasferisci o elimina la classe “${ownedClass.name}”.`,
            code: "SECURITY_OWNED_CLASS_BLOCKS_DELETE",
          },
          409,
        );
      const deleted = await auth.deleteAccount(account, mode, sessionHash, account.password_hash === NO_PASSWORD);
      if (!deleted)
        return json({ error: "Account cambiato. Accedi di nuovo.", code: "ACCOUNT_CHANGED" }, 409);
    }
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
