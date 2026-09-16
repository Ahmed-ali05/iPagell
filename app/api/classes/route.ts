import { createClassSchema } from "@/lib/classes/validation";
import { identity, rateLimit } from "@/lib/server/auth";
import { requireClassesEnabled } from "@/lib/server/class-access";
import { classRepository } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireClassesEnabled();
    const user = await identity(request);
    if (!user) return json({ error: "Accedi per vedere le classi" }, 401);
    return json({ classes: await classRepository().list(user) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi per creare una classe" }, 401);
    await rateLimit(request, user.username, "class-create");
    const parsed = createClassSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        { error: parsed.error.issues[0]?.message ?? "Controlla i campi" },
        400,
      );
    return json({ class: await classRepository().create(user, parsed.data) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
