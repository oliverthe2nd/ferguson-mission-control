import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UploadForm } from "@/components/upload/upload-form";
import { TemplateDownloads } from "@/components/upload/template-downloads";
import { requireAdmin } from "@/lib/auth";

export default async function UploadPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Upload Spreadsheet"
        description="Parse and store weekly or monthly report data for dashboard charts"
      />
      <UploadForm />
      <div className="mt-8">
        <TemplateDownloads />
      </div>
    </DashboardShell>
  );
}
