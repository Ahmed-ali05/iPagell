import { noteCreate } from "@/lib/notes/validation";
import { noteUser,notes,expectedUser } from "@/lib/server/note-http";
import { errorResponse,json,readJson,HttpError } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {
    const user=await noteUser(request);
    const after=Number(new URL(request.url).searchParams.get("after")??"0");
    if(!Number.isSafeInteger(after)||after<0) throw new HttpError(400,"Cursore non valido.");
    return json(await notes().personalChanges(user.id,after));
  } catch(error){return errorResponse(error);}
}
export async function POST(request:Request) {
  try {
    const user=await noteUser(request,true);
    const parsed=noteCreate.safeParse(await readJson(request,65536));
    if(!parsed.success) throw new HttpError(400,"Controlla materia, titolo e contenuto.");
    expectedUser(parsed.data.expectedUserId,user.id);
    return json({note:await notes().createPersonal(user,parsed.data)},201);
  } catch(error){return errorResponse(error);}
}
