import { identity, revokeSession, sessionCookie } from "@/lib/server/auth";
import { checkMutation, errorResponse, json } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    if (request.headers.has("X-IPagell-Account")) {
      const user = await identity(request);
      if (user && request.headers.get("X-IPagell-Account") !== user.id)
        return json({ error: "L’account è cambiato. Accedi di nuovo." }, 401);
    }
    await revokeSession(request);
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
