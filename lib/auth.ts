import { cache } from "react";
import { APPROVER_EMAILS } from "./constants";
import { isClerkConfigured } from "./clerk-config";
import { DEMO_USER } from "./demo-user";

export type UserRole = "admin" | "editor" | "viewer";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isApprover: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isApproverEmail(email: string): boolean {
  return (APPROVER_EMAILS as readonly string[]).includes(normalizeEmail(email));
}

export function isDemoMode(): boolean {
  return !isClerkConfigured();
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode()) {
    return { ...DEMO_USER, isApprover: isApproverEmail(DEMO_USER.email) };
  }

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const role = (user.publicMetadata?.role as UserRole | undefined) ?? "viewer";

  return {
    id: user.id,
    name:
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      email ??
      "User",
    email,
    role,
    isApprover: isApproverEmail(email),
  };
});

export function canAccessDataEntry(user: SessionUser): boolean {
  return user.role === "admin" || user.role === "editor" || user.isApprover;
}

export function canApproveSubmissions(user: SessionUser): boolean {
  return user.role === "admin" || user.isApprover;
}

/** Staff with editor role only — data entry screen, no dashboard access. */
export function isEntryStaffOnly(user: SessionUser): boolean {
  return user.role === "editor" && !user.isApprover;
}

export function canViewDashboards(user: SessionUser): boolean {
  return !isEntryStaffOnly(user);
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "admin") return null;
  return user;
}

export async function requireDataEntryAccess(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canAccessDataEntry(user)) return null;
  return user;
}

export async function requireApprover(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (!canApproveSubmissions(user)) return null;
  return user;
}

export async function getAuthUserId(): Promise<string | null> {
  if (isDemoMode()) {
    return DEMO_USER.id;
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}
