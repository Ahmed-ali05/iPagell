import { z } from "zod";
import { diarySchema } from "@/lib/validation";
import { repository } from "@/lib/server/db";
import {
  checkMutation,
  errorResponse,
  json,
  readJson,
} from "@/lib/server/http";
import { identity } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
const envelope = z
  .object({
    expectedUserId: z.string().min(1).max(300),
    revision: z.number().int().min(1),
    diary: diarySchema,
  })
  .strict();

export async function PUT(request: Request) {
  try {
    const user = await identity(request);
    if (!user)
      return json({ error: "Sessione scaduta. Accedi di nuovo.", code: "ACCOUNT_CHANGED" }, 401);
    checkMutation(request);
    const parsed = envelope.safeParse(await readJson(request));
    if (!parsed.success)
      return json(
        { error: "Dati non validi: controlla valori, date e collegamenti", code: "DIARY_INVALID_SNAPSHOT" },
        400,
      );
    if (parsed.data.expectedUserId !== user.id)
      return json(
        { error: "L’account attivo è cambiato. Ricarica per continuare.", code: "ACCOUNT_CHANGED" },
        401,
      );
    const { diary, revision } = parsed.data;
    const repo = repository();
    if (!(await repo.update(user, JSON.stringify(diary), revision)))
      return json(
        {
          error:
            "Il diario è stato modificato su un altro dispositivo. Nessun dato è stato sovrascritto.",
          code: "DIARY_CONFLICT",
        },
        409,
      );
    return json({ revision: revision + 1 });
  } catch (error) {
    return errorResponse(error);
  }
}
