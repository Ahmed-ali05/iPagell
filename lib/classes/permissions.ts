export const classRoles = ["owner", "moderator", "member"] as const;
export type ClassRole = (typeof classRoles)[number];

export const classActions = [
  "class:view",
  "content:create",
  "content:update-own",
  "content:moderate",
  "invite:manage",
  "member:remove",
  "role:manage",
  "class:manage",
  "class:delete",
  "class:transfer",
] as const;
export type ClassAction = (typeof classActions)[number];

const permissions: Record<ClassRole, ReadonlySet<ClassAction>> = {
  owner: new Set(classActions),
  moderator: new Set([
    "class:view",
    "content:create",
    "content:update-own",
    "content:moderate",
    "invite:manage",
    "member:remove",
  ]),
  member: new Set(["class:view", "content:create", "content:update-own"]),
};

export function canClassAction(role: ClassRole, action: ClassAction) {
  return permissions[role].has(action);
}

export function parseClassRole(value: string): ClassRole | null {
  return classRoles.includes(value as ClassRole) ? (value as ClassRole) : null;
}

export function classFeatureEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "enabled";
}
