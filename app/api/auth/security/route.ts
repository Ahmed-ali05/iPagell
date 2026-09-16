import { z } from "zod";
import { passwordSchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { identity, rateLimit, sessionCookie } from "@/lib/server/auth";
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
    if (!user) return json({ error: "Accedi di nuovo." }, 401);
    const parsed = schema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        {
          error:
            "Controlla i campi. La nuova password deve avere 15–128 caratteri.",
        },
        400,
      );
    const input = parsed.data;
    if (input.expectedUserId !== user.id)
      return json({ error: "Account cambiato. Ricarica la pagina." }, 401);
    await rateLimit(request, user.username, "security");
    const db = database();
    const account = await db
      .prepare("SELECT password_hash,auth_version FROM accounts WHERE id=?")
      .bind(user.id)
      .first<{ password_hash: string; auth_version: number }>();
    if (
      !account ||
      !(await verifyPassword(input.currentPassword, account.password_hash))
    )
      return json({ error: "Password non valida." }, 401);
    if (input.operation === "password") {
      const hash = await hashPassword(input.newPassword);
      const result = await db
        .prepare(
          "UPDATE accounts SET password_hash=?,auth_version=auth_version+1 WHERE id=? AND auth_version=?",
        )
        .bind(hash, user.id, account.auth_version)
        .run();
      if (result.meta.changes !== 1)
        return json(
          { error: "Credenziali già cambiate. Accedi di nuovo." },
          409,
        );
    } else {
      if (input.confirmation !== user.username)
        return json(
          { error: "Scrivi esattamente il tuo nome utente per confermare." },
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
          },
          409,
        );
      // D1 batch is transactional. Both deletes use the reauthenticated version.
      const results = await db.batch([
        db
          .prepare("DELETE FROM class_invites WHERE created_by=?")
          .bind(user.id),
        db
          .prepare(
            "DELETE FROM diaries WHERE user_id=? AND EXISTS(SELECT 1 FROM accounts WHERE id=? AND auth_version=?)",
          )
          .bind(user.id, user.id, account.auth_version),
        db
          .prepare("DELETE FROM accounts WHERE id=? AND auth_version=?")
          .bind(user.id, account.auth_version),
      ]);
      // D1 changes may include cascading session deletions.
      if (results[2].meta.changes < 1)
        return json({ error: "Account cambiato. Accedi di nuovo." }, 409);
    }
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
