import { subscriptionUpdate, revisionSchema } from "@/lib/classes/events";
import { classIdSchema } from "@/lib/classes/validation";
import { eventUser, eventRepository, privateReferences } from "@/lib/server/class-event-http";
import { json, readJson, errorResponse, HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{subscriptionId:string}>};
async function access(request:Request,context:Context) {
  const user=await eventUser(request), id=classIdSchema.safeParse((await context.params).subscriptionId);
  if(!id.success) throw new HttpError(404,"Attività non trovata");
  return {user,id:id.data};
}
export async function PATCH(request:Request,context:Context) {
  try {
    const {user,id}=await access(request,context);
    const parsed=subscriptionUpdate.safeParse(await readJson(request,16384));
    if(!parsed.success) return json({error:"Impostazioni personali non valide."},400);
    await privateReferences(user,parsed.data);
    await eventRepository().updateSubscription(user,id,parsed.data);
    return json({subscriptions:await eventRepository().subscriptions(user)});
  } catch(e) { return errorResponse(e); }
}
export async function DELETE(request:Request,context:Context) {
  try {
    const {user,id}=await access(request,context);
    const parsed=revisionSchema.safeParse(await readJson(request,1024));
    if(!parsed.success) return json({error:"Revisione mancante."},400);
    await eventRepository().unsubscribe(user,id,parsed.data.revision);
    return json({subscriptions:await eventRepository().subscriptions(user)});
  } catch(e) { return errorResponse(e); }
}
