import {
  classIdSchema,
  updateClassSchema,
} from "@/lib/classes/validation";
import { identity } from "@/lib/server/auth";
import {
  requireClassesEnabled,
  requireClassPermission,
} from "@/lib/server/class-access";
import { classRepository } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ classId: string }> };

async function params(context: Context) {
  const parsed = classIdSchema.safeParse((await context.params).classId);
  return parsed.success ? parsed.data : null;
}

export async function GET(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    const user = await identity(request);
    if (!user) return json({ error: "Accedi per vedere la classe" }, 401);
    const classId = await params(context);
    if (!classId) return json({ error: "Classe non trovata" }, 404);
    return json({ class: await classRepository().get(user, classId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const classId = await params(context);
    if (!classId) return json({ error: "Classe non trovata" }, 404);
    await requireClassPermission(user, classId, "class:manage");
    const parsed = updateClassSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json({ error: "Controlla nome e descrizione" }, 400);
    const repository = classRepository();
    await repository.update(classId, parsed.data, user.id);
    return json({ class: await repository.get(user, classId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const classId = await params(context);
    if (!classId) return json({ error: "Classe non trovata" }, 404);
    await requireClassPermission(user, classId, "class:delete");
    await classRepository().remove(classId, user.id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
