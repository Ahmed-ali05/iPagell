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
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const parsed = signupSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json({ error: parsed.error.issues[0].message }, 400);
    const { username, password } = parsed.data;
    await rateLimit(request, username, "register");
    const passwordHash = await hashPassword(password),
      id = crypto.randomUUID(),
      recoveryCode = randomToken();
    const result = await database()
      .prepare(
        `INSERT INTO accounts (id,username,password_hash,recovery_hash,auth_version,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(username) DO NOTHING`,
      )
      .bind(id, username, passwordHash, tokenHash(recoveryCode), Date.now())
      .run();
    if (result.meta.changes !== 1)
      return json(
        { error: "Nome utente non disponibile. Scegline un altro." },
        409,
      );
    const cookie = await issueSession(request, id, 1);
    const response = json({ user: { id, username }, recoveryCode }, 201);
    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
