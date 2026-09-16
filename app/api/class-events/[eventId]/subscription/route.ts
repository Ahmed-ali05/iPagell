import { subscriptionInput } from "@/lib/classes/events";
import { classIdSchema } from "@/lib/classes/validation";
import { eventUser, eventRepository, privateReferences } from "@/lib/server/class-event-http";
import { json, readJson, errorResponse } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function POST(request:Request,context:{params:Promise<{eventId:string}>}) {
  try {
    const user=await eventUser(request), id=classIdSchema.safeParse((await context.params).eventId);
    if(!id.success) return json({error:"Evento non trovato"},404);
    const parsed=subscriptionInput.safeParse(await readJson(request,4096));
    if(!parsed.success) return json({error:"Impostazioni personali non valide."},400);
    await privateReferences(user,parsed.data);
    await eventRepository().subscribe(user,id.data,parsed.data);
    return json({subscriptions:await eventRepository().subscriptions(user)},201);
  } catch(e) { return errorResponse(e); }
}
