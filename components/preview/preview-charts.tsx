"use client";

import {
  ArBucketChart,
  ReceivablesTrendChart,
  SchoolOutstandingChart,
} from "@/components/charts/accounts-charts";
import {
  ActiveStudentsTrendChart,
  AustraliaPipelineChart,
  BranchComparisonChart,
} from "@/components/charts/centres-charts";
import {
  AtRiskTrendChart,
  AvgDaysPerStageChart,
  MilestoneFunnelChart,
} from "@/components/charts/enrolment-charts";
import {
  IncentivesVsPlacementsChart,
  PlacementFunnelChart,
  TestimonialBreakdownChart,
} from "@/components/charts/placement-charts";
import {
  AvgDaysTrendChart,
  ConversionTrendChart,
  LeadSourceBarChart,
} from "@/components/charts/sales-pipeline-charts";
import {
  LodgementTrendChart,
  PendingActionsChart,
  SubclassBreakdownChart,
} from "@/components/charts/visa-charts";
import { ChartCard, Section } from "@/components/dashboard/chart-card";
import { getAllSampleData } from "@/lib/sample-rows";

export function PreviewCharts() {
  const {
    sales: sampleSales,
    enrolment: sampleEnrolment,
    visa: sampleVisa,
    accounts: sampleAccounts,
    placement: samplePlacement,
    centres: sampleCentres,
  } = getAllSampleData();

  return (
    <div className="space-y-10">
      <Section title="1. Sales & Marketing">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Lead Source Breakdown"
            subtitle="Stacked bar · weekly periods"
          >
            <LeadSourceBarChart data={sampleSales} />
          </ChartCard>
          <ChartCard
            title="Conversion % Trend"
            subtitle="Line · lead-to-registration %"
          >
            <ConversionTrendChart data={sampleSales} />
          </ChartCard>
          <ChartCard
            title="Average Days Trend"
            subtitle="Dual-line · reg→offer vs offer→payment"
          >
            <AvgDaysTrendChart data={sampleSales} />
          </ChartCard>
        </div>
      </Section>

      <Section title="2. Enrolment & Finance">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard
            title="Milestone Funnel"
            subtitle="Horizontal bar · completion by stage"
          >
            <MilestoneFunnelChart data={sampleEnrolment} />
          </ChartCard>
          <ChartCard
            title="AT RISK Overview"
            subtitle="Bar · students on track vs at risk"
          >
            <AtRiskTrendChart data={sampleEnrolment} />
          </ChartCard>
          <ChartCard
            title="Avg Days per Stage"
            subtitle="Line · target vs actual variance"
          >
            <AvgDaysPerStageChart data={sampleEnrolment} />
          </ChartCard>
        </div>
      </Section>

      <Section title="3. Visa Team">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Subclass Breakdown"
            subtitle="Horizontal bar · lodged by visa subclass (with % share)"
          >
            <SubclassBreakdownChart data={sampleVisa} />
          </ChartCard>
          <ChartCard
            title="Lodgement Trend"
            subtitle="Area · monthly lodged count (chronological)"
          >
            <LodgementTrendChart data={sampleVisa} />
          </ChartCard>
          <ChartCard
            title="Pending Actions"
            subtitle="Bar · pending actions by week"
          >
            <PendingActionsChart data={sampleVisa} />
          </ChartCard>
        </div>
      </Section>

      <Section title="4. Accounts">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard
            title="AR by Delinquency Bucket"
            subtitle="Bar · amount by follow-up tier"
          >
            <ArBucketChart data={sampleAccounts} />
          </ChartCard>
          <ChartCard
            title="Total Receivables"
            subtitle="Area · outstanding commission"
          >
            <ReceivablesTrendChart data={sampleAccounts} />
          </ChartCard>
          <ChartCard
            title="Per-School Outstanding"
            subtitle="Horizontal bar · top schools"
          >
            <SchoolOutstandingChart data={sampleAccounts} />
          </ChartCard>
        </div>
      </Section>

      <Section title="5. Job Placement">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Placement Funnel"
            subtitle="Bar · arrivals → settled → placed"
          >
            <PlacementFunnelChart data={samplePlacement} />
          </ChartCard>
          <ChartCard
            title="Testimonial Breakdown"
            subtitle="Bar · incentive types"
          >
            <TestimonialBreakdownChart data={samplePlacement} />
          </ChartCard>
          <ChartCard
            title="Incentives vs Placements"
            subtitle="Dual-axis · jobs vs spend (AUD)"
          >
            <IncentivesVsPlacementsChart data={samplePlacement} />
          </ChartCard>
        </div>
      </Section>

      <Section title="6. Study Centres">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Branch Comparison"
            subtitle="Grouped bar · Lautoka, POM, Lae"
          >
            <BranchComparisonChart data={sampleCentres} />
          </ChartCard>
          <ChartCard
            title="Active Students Trend"
            subtitle="Multi-line · Year 1 by branch"
          >
            <ActiveStudentsTrendChart data={sampleCentres} />
          </ChartCard>
          <ChartCard
            title="Australia Pipeline"
            subtitle="Bar · Y2/Y3 local vs Australia"
          >
            <AustraliaPipelineChart data={sampleCentres} />
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}
