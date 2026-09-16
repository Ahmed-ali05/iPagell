import { eventUpdate, revisionSchema } from "@/lib/classes/events";
import { classIdSchema } from "@/lib/classes/validation";
import { eventUser, eventRepository } from "@/lib/server/class-event-http";
import { requireClassPermission } from "@/lib/server/class-access";
import { json, readJson, errorResponse, HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string;eventId:string}>};
async function access(request:Request,context:Context) {
  const user=await eventUser(request), p=await context.params;
  if(!classIdSchema.safeParse(p.classId).success || !classIdSchema.safeParse(p.eventId).success) throw new HttpError(404,"Evento non trovato");
  await requireClassPermission(user,p.classId,"class:view");
  return {user,...p};
}
export async function PATCH(request:Request,context:Context) {
  try {
    const {user,classId,eventId}=await access(request,context);
    const parsed=eventUpdate.safeParse(await readJson(request,16384));
    if(!parsed.success) return json({error:"Modifica non valida."},400);
    await eventRepository().update(user,classId,eventId,parsed.data,parsed.data.revision);
    return json({ok:true});
  } catch(e) { return errorResponse(e); }
}
export async function DELETE(request:Request,context:Context) {
  try {
    const {user,classId,eventId}=await access(request,context);
    const parsed=revisionSchema.safeParse(await readJson(request,1024));
    if(!parsed.success) return json({error:"Revisione mancante."},400);
    await eventRepository().remove(user,classId,eventId,parsed.data.revision);
    return json({ok:true});
  } catch(e) { return errorResponse(e); }
}
