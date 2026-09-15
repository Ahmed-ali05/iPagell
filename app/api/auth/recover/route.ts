import { recoverySchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { hashPassword, randomToken, tokenHash } from "@/lib/server/password";
import { rateLimit, sessionCookie } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const parsed = recoverySchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        {
          error:
            "Controlla nome utente, codice e nuova password (15–128 caratteri).",
        },
        400,
      );
    const { username, password, recoveryCode } = parsed.data;
    await rateLimit(request, username, "recover");
    const nextCode = randomToken(),
      nextHash = await hashPassword(password);
    const result = await database()
      .prepare(
        `UPDATE accounts SET password_hash=?,recovery_hash=?,auth_version=auth_version+1 WHERE username=? AND recovery_hash=?`,
      )
      .bind(nextHash, tokenHash(nextCode), username, tokenHash(recoveryCode))
      .run();
    if (result.meta.changes !== 1)
      return json({ error: "Nome utente o codice non validi." }, 401);
    const response = json({ recoveryCode: nextCode });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
