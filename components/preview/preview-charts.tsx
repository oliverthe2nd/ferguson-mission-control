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
  EnrolmentMonthlyChart,
  MilestoneFunnelChart,
} from "@/components/charts/enrolment-charts";
import {
  IncentivesVsPlacementsChart,
  PlacementFunnelChart,
  TestimonialBreakdownChart,
} from "@/components/charts/placement-charts";
import {
  LeadConversionChart,
  LeadSourceBarChart,
  RegistrationsTrendChart,
  TotalLeadsChart,
} from "@/components/charts/sales-pipeline-charts";
import {
  ScheduledLeadsChart,
  StudyCentreAvgDaysChart,
  StudyCentrePipelineChart,
  WalkInTrafficChart,
} from "@/components/charts/study-centre-extended-charts";
import {
  LodgementTrendChart,
  PendingActionsChart,
  RefusalTrendChart,
  SubclassBreakdownChart,
} from "@/components/charts/visa-charts";
import {
  PendingActionsBreakdownChart,
  TurnaroundBucketChart,
  VisaPipelineStatusGrid,
} from "@/components/charts/visa-pipeline-charts";
import { ChartCard, Section } from "@/components/dashboard/chart-card";
import {
  sampleStudyCentreAvgDays,
  sampleStudyCentrePipeline,
  sampleVisaPipelineStatus,
} from "@/lib/framework/sample-supplements";
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
          <ChartCard title="Lead Source Breakdown" subtitle="Stacked bar · click to drill down" className="lg:col-span-2">
            <LeadSourceBarChart data={sampleSales} />
          </ChartCard>
          <ChartCard title="Total Leads Received" subtitle="Click a bar to drill down">
            <TotalLeadsChart data={sampleSales} />
          </ChartCard>
          <ChartCard title="Total Registrations" subtitle="Count + conversion %">
            <RegistrationsTrendChart data={sampleSales} />
          </ChartCard>
          <ChartCard title="Lead → Registration Conversion" subtitle="Leads vs registrations" className="lg:col-span-2">
            <LeadConversionChart data={sampleSales} />
          </ChartCard>
        </div>
      </Section>

      <Section title="2. Enrolment & Finance">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Monthly Enrolments" subtitle="Click a month to drill down" className="lg:col-span-3">
            <EnrolmentMonthlyChart data={sampleEnrolment} />
          </ChartCard>
          <ChartCard title="Milestone Funnel" subtitle="Five fee milestones">
            <MilestoneFunnelChart data={sampleEnrolment} />
          </ChartCard>
          <ChartCard title="AT RISK Overview" subtitle="On track vs at risk">
            <AtRiskTrendChart data={sampleEnrolment} />
          </ChartCard>
          <ChartCard title="Avg Days per Stage" subtitle="Per milestone">
            <AvgDaysPerStageChart data={sampleEnrolment} />
          </ChartCard>
        </div>
      </Section>

      <Section title="3. Visa Team">
        <div className="space-y-4">
          <ChartCard title="Current Status Pipeline" subtitle="Sample pipeline grid">
            <VisaPipelineStatusGrid status={sampleVisaPipelineStatus} />
          </ChartCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Lodgement Turnaround" subtitle="Click a bucket to see files">
              <TurnaroundBucketChart data={sampleVisa} />
            </ChartCard>
            <ChartCard title="Pending Actions by Type" subtitle="S56 · biometrics · medicals">
              <PendingActionsBreakdownChart status={sampleVisaPipelineStatus} />
            </ChartCard>
            <ChartCard title="Subclass Breakdown">
              <SubclassBreakdownChart data={sampleVisa} />
            </ChartCard>
            <ChartCard title="Lodgement Trend">
              <LodgementTrendChart data={sampleVisa} />
            </ChartCard>
            <ChartCard title="Refusal Trend">
              <RefusalTrendChart data={sampleVisa} />
            </ChartCard>
            <ChartCard title="Pending Actions by Week" className="lg:col-span-2">
              <PendingActionsChart data={sampleVisa} />
            </ChartCard>
          </div>
        </div>
      </Section>

      <Section title="4. Accounts">
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="AR by Delinquency Bucket">
            <ArBucketChart data={sampleAccounts} />
          </ChartCard>
          <ChartCard title="Total Receivables">
            <ReceivablesTrendChart data={sampleAccounts} />
          </ChartCard>
          <ChartCard title="Per-School Outstanding">
            <SchoolOutstandingChart data={sampleAccounts} />
          </ChartCard>
        </div>
      </Section>

      <Section title="5. Job Placement">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Placement Funnel">
            <PlacementFunnelChart data={samplePlacement} />
          </ChartCard>
          <ChartCard title="Testimonial Breakdown">
            <TestimonialBreakdownChart data={samplePlacement} />
          </ChartCard>
          <ChartCard title="Incentives vs Placements" className="lg:col-span-2">
            <IncentivesVsPlacementsChart data={samplePlacement} />
          </ChartCard>
        </div>
      </Section>

      <Section title="6. Study Centres">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Walk-in Traffic" subtitle="By branch">
            <WalkInTrafficChart data={sampleCentres} />
          </ChartCard>
          <ChartCard title="Scheduled Leads">
            <ScheduledLeadsChart data={sampleCentres} />
          </ChartCard>
          <ChartCard title="Enrolment Pipeline" subtitle="Kim-verification stages" className="lg:col-span-2">
            <StudyCentrePipelineChart stages={sampleStudyCentrePipeline} />
          </ChartCard>
          <ChartCard title="Avg Days: Reg → Offer & Offer → Installment" className="lg:col-span-2">
            <StudyCentreAvgDaysChart data={sampleStudyCentreAvgDays} />
          </ChartCard>
          <ChartCard title="Branch Comparison">
            <BranchComparisonChart data={sampleCentres} />
          </ChartCard>
          <ChartCard title="Active Students Trend">
            <ActiveStudentsTrendChart data={sampleCentres} />
          </ChartCard>
          <ChartCard title="Australia Pipeline" className="lg:col-span-2">
            <AustraliaPipelineChart data={sampleCentres} />
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}
