import { noteDelete,noteUpdate } from "@/lib/notes/validation";
import { noteUser,notes,expectedUser,validNoteId,requireNoteBody } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{noteId:string}>};
export async function GET(request:Request,context:Context) {
  try { const user=await noteUser(request); const id=validNoteId((await context.params).noteId); const note=await notes().personalOne(user.id,id); if(!note) throw new HttpError(404,"Appunto non trovato."); return json({note}); }
  catch(error){return errorResponse(error);}
}
export async function PATCH(request:Request,context:Context) {
  try { const user=await noteUser(request,true); const id=validNoteId((await context.params).noteId); const parsed=noteUpdate.safeParse(requireNoteBody(await readJson(request,65536),true)); if(!parsed.success) throw new HttpError(400,"Controlla materia, titolo e contenuto."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().updatePersonal(user,id,parsed.data)}); }
  catch(error){return errorResponse(error);}
}
export async function DELETE(request:Request,context:Context) {
  try { const user=await noteUser(request,true); const id=validNoteId((await context.params).noteId); const parsed=noteDelete.safeParse(requireNoteBody(await readJson(request,4096),true,false)); if(!parsed.success) throw new HttpError(400,"Richiesta non valida."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().deletePersonal(user.id,id,parsed.data.baseRevision,parsed.data.mutationId,parsed.data.expectedContentFormat)}); }
  catch(error){return errorResponse(error);}
}
