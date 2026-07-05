import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataEntryClient } from "@/components/data-entry/data-entry-client";
import { requireDataEntryAccess } from "@/lib/auth";
import { isEditableReportType, REPORT_TYPE_LABELS } from "@/lib/constants";

type PageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function DataEntryTypePage({ params, searchParams }: PageProps) {
  const user = await requireDataEntryAccess();
  if (!user) {
    redirect("/dashboard");
  }

  const { type } = await params;
  const { mode: modeParam } = await searchParams;
  if (!isEditableReportType(type)) {
    notFound();
  }

  const mode = modeParam === "add" ? "append" : "full";

  return (
    <DashboardShell>
      <PageHeader
        title={`${REPORT_TYPE_LABELS[type]} — Data Entry`}
      />
      <DataEntryClient reportType={type} mode={mode} />
    </DashboardShell>
  );
}
