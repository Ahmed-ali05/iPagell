import { classIdSchema } from "@/lib/classes/validation";
import { identity } from "@/lib/server/auth";
import {
  requireClassesEnabled,
  requireClassPermission,
} from "@/lib/server/class-access";
import { classRepository } from "@/lib/server/db";
import { checkMutation, errorResponse, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ classId: string; inviteId: string }> };

export async function DELETE(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const route = await context.params;
    const parsedClassId = classIdSchema.safeParse(route.classId);
    const parsedInviteId = classIdSchema.safeParse(route.inviteId);
    if (!parsedClassId.success || !parsedInviteId.success)
      return json({ error: "Invito non trovato" }, 404);
    await requireClassPermission(user, parsedClassId.data, "invite:manage");
    await classRepository().revokeInvite(
      parsedClassId.data,
      parsedInviteId.data,
      user.id,
    );
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
