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
import { AuthRepository } from "@/lib/server/auth-repository";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const parsed = recoverySchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        {
          error:
            "Controlla nome utente, codice e nuova password (12–128 caratteri).",
          code: "AUTH_INVALID_RECOVERY",
        },
        400,
      );
    const { username, password, recoveryCode } = parsed.data;
    await rateLimit(request, username, "recover");
    const auth = new AuthRepository(database());
    const mode = await auth.mode();
    const account = await auth.find(username, mode);
    const nextCode = randomToken(), nextHash = await hashPassword(password);
    const valid = account?.password_hash && account.recovery_hash === tokenHash(recoveryCode);
    const changed = valid && await auth.replacePassword(account, nextHash, tokenHash(nextCode), mode);
    if (!changed)
      return json({ error: "Nome utente o codice non validi.", code: "AUTH_INVALID_RECOVERY" }, 401);
    const response = json({ recoveryCode: nextCode });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
