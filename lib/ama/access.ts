import { APPROVER_EMAILS } from "@/lib/constants";
import { getSessionUser, type SessionUser } from "@/lib/auth";

const AMA_EMAILS = new Set(
  APPROVER_EMAILS.map((email) => email.toLowerCase()),
);

export function canAccessAskMeAnything(
  user: Pick<SessionUser, "email"> | null | undefined,
): boolean {
  if (!user?.email) return false;
  return AMA_EMAILS.has(user.email.trim().toLowerCase());
}

export async function requireAskMeAnythingAccess(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !canAccessAskMeAnything(user)) return null;
  return user;
}
