import { z } from "zod";
import { classSubjectUpdate,noteId } from "@/lib/notes/validation";
import { classNoteAccess,notes } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string;subjectId:string}>};
const deletion=z.object({baseRevision:z.number().int().positive()}).strict();
export async function PATCH(request:Request,context:Context) {
  try { const {classId,subjectId}=await context.params; const {user,role}=await classNoteAccess(request,classId,true); if(!noteId.safeParse(subjectId).success && !subjectId.startsWith("legacy-")) throw new HttpError(404,"Materia non trovata."); const parsed=classSubjectUpdate.safeParse(await readJson(request,4096)); if(!parsed.success) throw new HttpError(400,"Materia non valida."); return json({subject:await notes().updateClassSubject(classId,subjectId,user.id,role,parsed.data)}); }
  catch(error){return errorResponse(error);}
}
export async function DELETE(request:Request,context:Context) {
  try { const {classId,subjectId}=await context.params; const {user}=await classNoteAccess(request,classId,true); const parsed=deletion.safeParse(await readJson(request,4096)); if(!parsed.success) throw new HttpError(400,"Richiesta non valida."); await notes().deleteClassSubject(classId,subjectId,user.id,parsed.data.baseRevision); return json({ok:true}); }
  catch(error){return errorResponse(error);}
}
