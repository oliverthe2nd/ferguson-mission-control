import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionUser, isEntryStaffOnly } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (user && isEntryStaffOnly(user)) {
    redirect("/data-entry");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
