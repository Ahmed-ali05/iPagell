import { z } from "zod";
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(
    /^[a-z0-9][a-z0-9_.-]*$/,
    "Usa 3–32 lettere, numeri, punti, trattini o underscore.",
  );
export const passwordSchema = z
  .string()
  .min(12, "Usa almeno 12 caratteri, per esempio una frase lunga.")
  .max(128, "Massimo 128 caratteri.")
  .refine(
    (v) => !/^(.)(\1)+$/.test(v),
    "Scegli una password meno prevedibile.",
  );
export const credentialsSchema = z
  .object({ username: usernameSchema, password: z.string().min(1).max(128) })
  .strict();
export const signupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    // Dichiarazione di età: 14 anni o autorizzazione di un genitore (docs/legal).
    ageConfirmed: z.literal(true, { message: "Conferma l’età o l’autorizzazione di un genitore." }),
  })
  .strict();
export const recoverySchema = z
  .object({
    username: usernameSchema,
    recoveryCode: z.string().regex(/^[a-f0-9]{64}$/),
    password: passwordSchema,
  })
  .strict();
