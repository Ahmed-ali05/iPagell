import {
  classIdSchema,
  createInviteSchema,
} from "@/lib/classes/validation";
import { identity, rateLimit } from "@/lib/server/auth";
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
async function classId(context: Context) {
  const result = classIdSchema.safeParse((await context.params).classId);
  return result.success ? result.data : null;
}

export async function GET(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const id = await classId(context);
    if (!id) return json({ error: "Classe non trovata" }, 404);
    await requireClassPermission(user, id, "invite:manage");
    return json({ invites: await classRepository().listInvites(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi di nuovo" }, 401);
    const id = await classId(context);
    if (!id) return json({ error: "Classe non trovata" }, 404);
    await requireClassPermission(user, id, "invite:manage");
    await rateLimit(request, user.username, `class-invite:${id}`);
    const parsed = createInviteSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json({ error: "Controlla scadenza e numero di ingressi" }, 400);
    return json(
      {
        invite: await classRepository().createInvite(user, id, parsed.data),
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
