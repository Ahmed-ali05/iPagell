import { registerSchema } from "@/lib/validation";
import { createDiary } from "@/lib/new-diary";
import { repository } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { identity } from "@/lib/server/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await identity(request);
    if (!user) return json({ user: null }, 401);
    return json({ user, diary: await repository().get(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await identity(request);
    if (!user) return json({ error: "Accedi per creare un profilo" }, 401);
    checkMutation(request);
    const input = registerSchema.safeParse(await readJson(request));
    if (!input.success)
      return json({ error: "Controlla nome e date del semestre" }, 400);
    const diary = createDiary(input.data);
    if (!(await repository().create(user, JSON.stringify(diary))))
      return json({ error: "Profilo già presente: ricarica la pagina" }, 409);
    return json({ user, diary: { ...diary, revision: 1 } }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
