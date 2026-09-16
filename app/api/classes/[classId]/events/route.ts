import { eventFields } from "@/lib/classes/events";
import { classIdSchema } from "@/lib/classes/validation";
import { eventUser, eventRepository } from "@/lib/server/class-event-http";
import { requireClassPermission } from "@/lib/server/class-access";
import { rateLimit } from "@/lib/server/auth";
import { json, readJson, errorResponse, HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string}>};
async function access(request:Request,context:Context) {
  const user=await eventUser(request);
  const id=classIdSchema.safeParse((await context.params).classId);
  if(!id.success) throw new HttpError(404,"Classe non trovata");
  await requireClassPermission(user,id.data,"class:view");
  return {user,id:id.data};
}
export async function GET(request:Request,context:Context) {
  try { const {user,id}=await access(request,context); return json({events:await eventRepository().list(user,id)}); } catch(e) { return errorResponse(e); }
}
export async function POST(request:Request,context:Context) {
  try {
    const {user,id}=await access(request,context);
    await rateLimit(request,user.username,"class-event");
    const parsed=eventFields.safeParse(await readJson(request,16384));
    if(!parsed.success) return json({error:"Controlla titolo, materia, data e descrizione."},400);
    const eventId=await eventRepository().create(user,id,parsed.data);
    return json({id:eventId},201);
  } catch(e) { return errorResponse(e); }
}
