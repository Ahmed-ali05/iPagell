import type { AccountIdentity } from "@/types/domain";
import { identity } from "./auth";
import { requireClassesEnabled } from "./class-access";
import { ClassEventRepository } from "./class-event-repository";
import { database, repository } from "./db";
import { checkMutation, HttpError } from "./http";
export async function eventUser(request: Request) {
  requireClassesEnabled();
  if(request.method!=="GET") checkMutation(request);
  const user=await identity(request);
  if(!user) throw new HttpError(401,"Accedi di nuovo.");
  if((request.method!=="GET" || request.headers.has("X-IPagell-Account")) && request.headers.get("X-IPagell-Account")!==user.id)
    throw new HttpError(401,"Account cambiato. Ricarica prima di continuare.");
  return user;
}
export const eventRepository = () => new ClassEventRepository(database());
export async function privateReferences(user: AccountIdentity, input: {semesterId?:string;subjectId?:string}) {
  if(input.semesterId===undefined && !input.subjectId) return;
  const diary=await repository().get(user);
  if(!diary || (input.semesterId && !diary.data.semesters.some(s=>s.id===input.semesterId)) ||
    (input.subjectId && !diary.data.subjects.some(s=>s.id===input.subjectId)))
    throw new HttpError(400,"Sincronizza prima il diario e scegli un periodo e una materia personali validi.");
}
