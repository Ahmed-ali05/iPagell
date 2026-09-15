import { revokeSession, sessionCookie } from "@/lib/server/auth";
import { checkMutation, errorResponse, json } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request);
    await revokeSession(request);
    const response = json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(request, "", 0));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
