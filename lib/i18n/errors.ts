import type { MessageKey } from "./index";

const errorKeys = {
  AUTH_INVALID_CREDENTIALS: "auth.invalidCredentials",
  AUTH_USERNAME_TAKEN: "auth.usernameTaken",
  AUTH_INVALID_SIGNUP: "auth.invalidSignup",
  AUTH_INVALID_RECOVERY: "auth.invalidRecovery",
  DIARY_INVALID_INPUT: "auth.invalidDiary",
  ACCOUNT_CHANGED: "auth.accountChanged",
  DIARY_ALREADY_EXISTS: "auth.diaryExists",
  DIARY_INVALID_SNAPSHOT: "sync.invalidData",
  DIARY_CONFLICT: "sync.conflictDetail",
  SECURITY_SESSION_REQUIRED: "security.sessionRequired",
  SECURITY_INVALID_INPUT: "security.invalidInput",
  SECURITY_INVALID_PASSWORD: "security.invalidPassword",
  SECURITY_CREDENTIALS_CHANGED: "security.credentialsChanged",
  SECURITY_CONFIRMATION_MISMATCH: "security.confirmationMismatch",
  SECURITY_OWNED_CLASS_BLOCKS_DELETE: "security.ownedClassBlocksDelete",
} as const satisfies Record<string, MessageKey>;

export function apiErrorKey(code: string | undefined, fallback: MessageKey = "error.generic"): MessageKey {
  return code && Object.hasOwn(errorKeys, code) ? errorKeys[code as keyof typeof errorKeys] : fallback;
}
