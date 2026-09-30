import { noteDelete } from "@/lib/notes/validation";
import { noteUser,notes,validNoteId,expectedUser,requireNoteBody } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{noteId:string}>};
export async function DELETE(request:Request,context:Context) {
  try {const user=await noteUser(request,true); const id=validNoteId((await context.params).noteId); const parsed=noteDelete.safeParse(requireNoteBody(await readJson(request,4096),true,false)); if(!parsed.success) throw new HttpError(400,"Richiesta non valida."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().withdrawAuthored(user.id,id,parsed.data.baseRevision,parsed.data.mutationId,parsed.data.expectedContentFormat)});}
  catch(error){return errorResponse(error);}
}
