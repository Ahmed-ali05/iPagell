import { classNoteAccess,notes,validNoteId } from "@/lib/server/note-http";
import { errorResponse,json,readJson } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string;noteId:string}>};
async function mutate(request:Request,context:Context,value:boolean) {
  try {const {classId,noteId}=await context.params; const {user}=await classNoteAccess(request,classId,true); await readJson(request,4096); return json(await notes().pin(user.id,classId,validNoteId(noteId),value));}
  catch(error){return errorResponse(error);}
}
export const PUT=(request:Request,context:Context)=>mutate(request,context,true);
export const DELETE=(request:Request,context:Context)=>mutate(request,context,false);
