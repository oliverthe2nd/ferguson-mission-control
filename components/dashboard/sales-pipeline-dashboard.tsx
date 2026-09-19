"use client";

import { useMemo, useState } from "react";
import {
  LeadConversionChart,
  LeadSourceBarChart,
  RegistrationsTrendChart,
  TotalLeadsChart,
} from "@/components/charts/sales-pipeline-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { filterSalesRowsByPipeline } from "@/lib/zoho/aggregate-sales-pipeline";
import {
  SALES_PIPELINE_LABELS,
  type SalesPipelineLabel,
} from "@/lib/zoho-sales-mapping";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";

type PipelineFilter = SalesPipelineLabel | "All";

const FILTERS: PipelineFilter[] = ["All", ...SALES_PIPELINE_LABELS];

export function SalesPipelineDashboard({
  rows,
}: {
  rows: SalesPipelineRow[];
}) {
  const [pipeline, setPipeline] = useState<PipelineFilter>("All");

  const filtered = useMemo(
    () => filterSalesRowsByPipeline(rows, pipeline),
    [rows, pipeline],
  );

  if (rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const active = pipeline === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPipeline(value)}
              className={
                active
                  ? "rounded-full bg-dark px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
              }
            >
              {value}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Lead Source Breakdown"
            subtitle="Click a segment to drill down"
            className="lg:col-span-2"
          >
            <LeadSourceBarChart data={filtered} />
          </ChartCard>
          <ChartCard
            title="Total Leads Received"
            subtitle="Click a bar to drill down by source"
          >
            <TotalLeadsChart data={filtered} />
          </ChartCard>
          <ChartCard
            title="Total Registrations"
            subtitle="Count (bars) with conversion % (line)"
          >
            <RegistrationsTrendChart data={filtered} />
          </ChartCard>
          <ChartCard
            title="Lead → Registration Conversion"
            subtitle="Leads vs registrations with %"
            className="lg:col-span-2"
          >
            <LeadConversionChart data={filtered} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
