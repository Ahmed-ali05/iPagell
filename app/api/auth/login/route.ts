import { credentialsSchema } from "@/lib/auth-validation";
import { database } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { DUMMY_HASH, verifyPassword } from "@/lib/server/password";
import { issueSession, rateLimit } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    const parsed = credentialsSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json({ error: "Nome utente o password non validi.", code: "AUTH_INVALID_CREDENTIALS" }, 400);
    const { username, password } = parsed.data;
    await rateLimit(request, username, "login");
    const account = await database()
      .prepare(
        "SELECT id,username,password_hash,auth_version FROM accounts WHERE username=?",
      )
      .bind(username)
      .first<{
        id: string;
        username: string;
        password_hash: string;
        auth_version: number;
      }>();
    const valid = await verifyPassword(
      password,
      account?.password_hash ?? DUMMY_HASH,
    );
    if (!valid || !account)
      return json({ error: "Nome utente o password non validi.", code: "AUTH_INVALID_CREDENTIALS" }, 401);
    const cookie = await issueSession(
      request,
      account.id,
      account.auth_version,
    );
    const response = json({
      user: { id: account.id, username: account.username },
    });
    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
