import type { BackupPayload, Preferences, SchoolData } from "@/types/domain";
import type { ClassSubscription } from "./events";
import { backupSchema } from "@/lib/validation";

// A portable backup deliberately freezes shared events as personal activities.
// No invitation, membership, subscriber identity or live class connection is exported.
export function backupWithClassAgenda(data: SchoolData, preferences: Preferences, subscriptions: ClassSubscription[]): BackupPayload {
  const copy=structuredClone(data);
  for (const item of subscriptions) {
    const id=`class-snapshot-${item.id}`;
    if(copy.agenda.some(a=>a.id===id)) continue;
    let subject=copy.subjects.find(s=>s.id===item.subjectId);
    if(!subject) subject=copy.subjects.find(s=>s.name===item.event.subject);
    if(!subject) {
      if(copy.subjects.length>=150) throw new Error("Il backup completo supera il limite di materie. Associa prima gli eventi alle tue materie.");
      subject={id:`class-subject-${item.id}`,name:item.event.subject,color:"#7772d5",coefficient:1,gradeTypes:[{id:`class-type-${item.id}`,name:"Standard",weight:1}]};
      copy.subjects.push(subject);
    }
    copy.agenda.push({id,subjectId:subject.id,semesterId:copy.semesters.some(s=>s.id===item.semesterId)?item.semesterId:preferences.currentSemesterId,
      kind:item.event.kind,title:`${item.event.status==="cancelled"?"[Annullato] ":""}${item.event.title}`,dueAt:item.event.dueAt,
      description:`Copia personale da ${item.event.className}.\n${item.event.description}`,completed:item.completed,reminder:item.reminder&&item.event.status!=="cancelled"});
  }
  return backupSchema.parse({app:"iPagell",exportedAt:new Date().toISOString(),data:copy,preferences});
}
