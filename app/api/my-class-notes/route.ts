import { noteUser,notes,afterId } from "@/lib/server/note-http";
import { errorResponse,json } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {const user=await noteUser(request); return json(await notes().authoredNotes(user.id,afterId(request)));}
  catch(error){return errorResponse(error);}
}
