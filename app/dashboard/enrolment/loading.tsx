import { DashboardChartsSkeleton } from "@/components/ui/dashboard-skeleton";

export default function EnrolmentLoading() {
  return (
    <DashboardChartsSkeleton columns={3} chartCount={3} withTable />
  );
}
