import { cache } from "react";
import { isClerkConfigured } from "./clerk-config";
import { DEMO_USER } from "./demo-user";

export type UserRole = "admin" | "viewer";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function isDemoMode(): boolean {
  return !isClerkConfigured();
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode()) {
    return DEMO_USER;
  }

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return null;

  const role = (user.publicMetadata?.role as UserRole | undefined) ?? "viewer";

  return {
    id: user.id,
    name:
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      user.emailAddresses[0]?.emailAddress ??
      "User",
    email: user.emailAddresses[0]?.emailAddress ?? "",
    role,
  };
});

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "admin") return null;
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
