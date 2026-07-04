import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ApprovalHistory, ApprovalInbox } from "@/components/approvals/approval-inbox";
import { requireApprover } from "@/lib/auth";

export default async function ApprovalsPage() {
  const user = await requireApprover();
  if (!user) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Approvals"
        description="Review spreadsheet submissions before they publish to live dashboards."
      />

      {!process.env.DATABASE_URL && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Database not configured — approvals are unavailable.
        </div>
      )}

      <ApprovalInbox />
      <ApprovalHistory />
    </DashboardShell>
  );
}
