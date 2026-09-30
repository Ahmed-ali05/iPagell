import { identity } from "./auth";
import { requireClassesEnabled, requireClassPermission } from "./class-access";
import { database } from "./db";
import { HttpError, checkMutation } from "./http";
import { NoteRepository } from "./note-repository";
import { classIdSchema } from "@/lib/classes/validation";
import { noteId } from "@/lib/notes/validation";

export const notes = () => new NoteRepository(database());
export async function noteUser(request:Request, mutation=false) {
  if(mutation) checkMutation(request);
  const user=await identity(request);
  if(!user) throw new HttpError(401,"Accedi di nuovo.");
  const header=request.headers.get("X-IPagell-Account");
  if((mutation||header) && header!==user.id) throw new HttpError(401,"Account cambiato. Accedi di nuovo.");
  return user;
}
export function expectedUser(expected:string,actual:string) {
  if(expected!==actual) throw new HttpError(401,"Account cambiato. Accedi di nuovo.");
}
export function validNoteId(id:string) {
  if(!noteId.safeParse(id).success) throw new HttpError(404,"Appunto non trovato.");
  return id;
}
export async function classNoteAccess(request:Request,classId:string,mutation=false) {
  requireClassesEnabled();
  const user=await noteUser(request,mutation);
  if(!classIdSchema.safeParse(classId).success) throw new HttpError(404,"Classe non trovata.");
  const role=await requireClassPermission(user,classId,mutation?"content:create":"class:view");
  return {user,role};
}
export function afterId(request:Request) {
  const value=new URL(request.url).searchParams.get("after")??"";
  if(value && !noteId.safeParse(value).success) throw new HttpError(400,"Cursore non valido.");
  return value;
}
