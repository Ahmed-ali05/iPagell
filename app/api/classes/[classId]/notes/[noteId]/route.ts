import { classNoteDelete,classNoteUpdate } from "@/lib/notes/validation";
import { classNoteAccess,notes,expectedUser,validNoteId } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string;noteId:string}>};
export async function GET(request:Request,context:Context) {
  try {const {classId,noteId}=await context.params; const {user}=await classNoteAccess(request,classId); const note=await notes().classOne(classId,validNoteId(noteId),user.id); if(!note) throw new HttpError(404,"Appunto non trovato."); return json({note});}
  catch(error){return errorResponse(error);}
}
export async function PATCH(request:Request,context:Context) {
  try {const {classId,noteId}=await context.params; const {user}=await classNoteAccess(request,classId,true); const parsed=classNoteUpdate.safeParse(await readJson(request,65536)); if(!parsed.success) throw new HttpError(400,"Controlla materia, titolo e contenuto."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().updateClassNote(user.id,classId,validNoteId(noteId),parsed.data)});}
  catch(error){return errorResponse(error);}
}
export async function DELETE(request:Request,context:Context) {
  try {const {classId,noteId}=await context.params; const {user}=await classNoteAccess(request,classId,true); const parsed=classNoteDelete.safeParse(await readJson(request,4096)); if(!parsed.success) throw new HttpError(400,"Richiesta non valida."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().deleteClassNote(user.id,classId,validNoteId(noteId),parsed.data.baseRevision,parsed.data.mutationId)});}
  catch(error){return errorResponse(error);}
}
