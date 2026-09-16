import { eventUser, eventRepository } from "@/lib/server/class-event-http";
import { json, errorResponse } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try { const user=await eventUser(request); return json({subscriptions:await eventRepository().subscriptions(user)}); } catch(e) { return errorResponse(e); }
}
