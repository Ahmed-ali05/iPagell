import { classNoteCreate } from "@/lib/notes/validation";
import { classNoteAccess,afterId,notes,expectedUser,requireNoteBody } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
type Context={params:Promise<{classId:string}>};
export async function GET(request:Request,context:Context) {
  try { const {classId}=await context.params; const {user}=await classNoteAccess(request,classId); return json(await notes().classNotes(classId,user.id,afterId(request))); }
  catch(error){return errorResponse(error);}
}
export async function POST(request:Request,context:Context) {
  try { const {classId}=await context.params; const {user}=await classNoteAccess(request,classId,true); const parsed=classNoteCreate.safeParse(requireNoteBody(await readJson(request,65536))); if(!parsed.success) throw new HttpError(400,"Controlla materia, titolo e contenuto."); expectedUser(parsed.data.expectedUserId,user.id); return json({note:await notes().createClassNote(user,classId,parsed.data)},201); }
  catch(error){return errorResponse(error);}
}
