import type { ClassRole } from "@/lib/classes/permissions";

export interface ClassSummary {
  id: string;
  name: string;
  description: string;
  role: ClassRole;
  displayName: string;
  memberCount: number;
  createdAt: number;
}

export interface ClassMember {
  userId: string;
  displayName: string;
  role: ClassRole;
  joinedAt: number;
  isCurrentUser: boolean;
}

export interface ClassDetail extends ClassSummary {
  members: ClassMember[];
}

export interface ClassInvite {
  id: string;
  expiresAt: number | null;
  maxUses: number;
  uses: number;
  revokedAt: number | null;
  createdAt: number;
}

export interface CreatedClassInvite extends ClassInvite {
  code: string;
}
