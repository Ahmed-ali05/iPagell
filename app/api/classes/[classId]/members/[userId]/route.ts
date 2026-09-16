import { classIdSchema, updateMemberSchema } from "@/lib/classes/validation";
import { canClassAction } from "@/lib/classes/permissions";
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
type Context = { params: Promise<{ classId: string; userId: string }> };

async function routeParams(context: Context) {
  const route = await context.params;
  const classId = classIdSchema.safeParse(route.classId);
  return classId.success && route.userId.length <= 100
    ? { classId: classId.data, userId: route.userId }
    : null;
}

export async function GET(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const route = await routeParams(context);
    if (!route) return json({ error: "Membro non trovato" }, 404);
    await requireClassPermission(user, route.classId, "class:view");
    const detail = await classRepository().get(user, route.classId);
    const member = detail.members.find((item) => item.userId === route.userId);
    return member
      ? json({ member })
      : json({ error: "Membro non trovato" }, 404);
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
    const route = await routeParams(context);
    if (!route) return json({ error: "Membro non trovato" }, 404);
    const parsed = updateMemberSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success) return json({ error: "Modifica non valida" }, 400);
    const repository = classRepository();
    if (parsed.data.operation === "display-name") {
      await requireClassPermission(user, route.classId, "class:view");
      if (route.userId !== user.id)
        return json({ error: "Puoi cambiare solo il tuo nome" }, 403);
      await repository.updateDisplayName(
        route.classId,
        user.id,
        parsed.data.displayName,
      );
    } else if (parsed.data.operation === "role") {
      await requireClassPermission(user, route.classId, "role:manage");
      await repository.updateRole(route.classId, route.userId, parsed.data.role);
    } else {
      await requireClassPermission(user, route.classId, "class:transfer");
      await repository.transfer(route.classId, user.id, route.userId);
    }
    return json({ class: await repository.get(user, route.classId) });
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
    const route = await routeParams(context);
    if (!route) return json({ error: "Membro non trovato" }, 404);
    const actorRole = await requireClassPermission(
      user,
      route.classId,
      "class:view",
    );
    const repository = classRepository();
    const targetRole = await repository.memberRole(route.classId, route.userId);
    if (route.userId !== user.id) {
      if (!canClassAction(actorRole, "member:remove"))
        return json({ error: "Azione non consentita" }, 403);
      if (actorRole === "moderator" && targetRole !== "member")
        return json(
          { error: "Solo il proprietario può rimuovere un moderatore" },
          403,
        );
    }
    await repository.removeMember(route.classId, route.userId);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
