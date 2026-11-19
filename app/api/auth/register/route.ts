import { signupSchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { hashPassword, randomToken, tokenHash } from "@/lib/server/password";
import { issueSession, rateLimit } from "@/lib/server/auth";
import { AuthRepository } from "@/lib/server/auth-repository";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const parsed = signupSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json({ error: parsed.error.issues[0].message, code: "AUTH_INVALID_SIGNUP" }, 400);
    const { username, password } = parsed.data;
    await rateLimit(request, username, "register");
    const auth = new AuthRepository(database());
    const mode = await auth.mode();
    const passwordHash = await hashPassword(password),
      id = crypto.randomUUID(),
      recoveryCode = randomToken();
    const created = await auth.register(id, username, passwordHash, tokenHash(recoveryCode), mode);
    if (!created)
      return json(
        { error: "Nome utente non disponibile. Scegline un altro.", code: "AUTH_USERNAME_TAKEN" },
        409,
      );
    const cookie = await issueSession(request, id, 1, mode);
    const response = json({ user: { id, username }, recoveryCode }, 201);
    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
