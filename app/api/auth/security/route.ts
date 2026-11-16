import { z } from "zod";
import { passwordSchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/server/password";
import { identity, rateLimit, sessionCookie, sessionTokenHash } from "@/lib/server/auth";
import { AuthRepository } from "@/lib/server/auth-repository";
export const dynamic = "force-dynamic";
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
      currentPassword: z.string().min(1).max(128),
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
    const valid = await verifyPassword(input.currentPassword, account?.password_hash ?? DUMMY_HASH);
    if (!account || !account.password_hash || !sessionHash || !valid)
      return json({ error: "Password non valida.", code: "SECURITY_INVALID_PASSWORD" }, 401);
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
      const deleted = await auth.deleteAccount(account, mode, sessionHash);
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
