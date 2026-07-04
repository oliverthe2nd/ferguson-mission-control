import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SubmissionReview } from "@/components/approvals/submission-review";
import { canApproveSubmissions, getSessionUser } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalDetailPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const canReview = canApproveSubmissions(user);

  return (
    <DashboardShell>
      <PageHeader
        title="Review submission"
        description={
          canReview
            ? "Compare proposed changes against the current live data."
            : "View your submitted changes and review status."
        }
      />
      <SubmissionReview submissionId={id} canReview={canReview} />
    </DashboardShell>
  );
}
