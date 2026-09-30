import { classSubjectCreate } from "@/lib/notes/validation";
import { classNoteAccess,notes } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string}>};
export async function GET(request:Request,context:Context) {
  try { const {classId}=await context.params; await classNoteAccess(request,classId); return json({subjects:await notes().classSubjects(classId)}); }
  catch(error){return errorResponse(error);}
}
export async function POST(request:Request,context:Context) {
  try { const {classId}=await context.params; const {user}=await classNoteAccess(request,classId,true); const parsed=classSubjectCreate.safeParse(await readJson(request,4096)); if(!parsed.success) throw new HttpError(400,"Nome della materia non valido."); return json({subject:await notes().addClassSubject(classId,parsed.data.name,user.id)},201); }
  catch(error){return errorResponse(error);}
}
