import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataEntryClient } from "@/components/data-entry/data-entry-client";
import { requireDataEntryAccess } from "@/lib/auth";
import { isEditableReportType, REPORT_TYPE_LABELS } from "@/lib/constants";

type PageProps = {
  params: Promise<{ type: string }>;
};

export default async function DataEntryTypePage({ params }: PageProps) {
  const user = await requireDataEntryAccess();
  if (!user) {
    redirect("/dashboard");
  }

  const { type } = await params;
  if (!isEditableReportType(type)) {
    notFound();
  }

  return (
    <DashboardShell>
      <PageHeader
        title={`${REPORT_TYPE_LABELS[type]} — Data Entry`}
        description="Edit rows below and submit for approval. Live dashboards update only after review."
      />
      <DataEntryClient reportType={type} />
    </DashboardShell>
  );
}
