import { errorResponse, json } from "@/lib/server/http";
import { currentGoogleConfig } from "@/lib/server/google-auth";
export const dynamic = "force-dynamic";

// Readiness only: booleans, never client IDs or secrets.
export async function GET(request: Request) {
  try {
    return json({ google: currentGoogleConfig(request) !== null });
  } catch (error) {
    return errorResponse(error);
  }
}
