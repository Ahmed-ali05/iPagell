import { joinClassSchema } from "@/lib/classes/validation";
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

export async function POST(request: Request) {
  try {
    requireClassesEnabled();
    checkMutation(request);
    const user = await identity(request);
    if (!user) return json({ error: "Accedi per unirti alla classe" }, 401);
    await rateLimit(request, user.username, "class-join");
    const parsed = joinClassSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success)
      return json(
        { error: parsed.error.issues[0]?.message ?? "Controlla il codice" },
        400,
      );
    return json(
      {
        class: await classRepository().join(
          user,
          parsed.data.code,
          parsed.data.displayName,
        ),
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
