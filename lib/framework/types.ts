/** Drill-down row shown when clicking a chart segment. */
export type DrillDownRecord = {
  id: string;
  label: string;
  sublabel?: string;
  detail?: string;
  meta?: Record<string, string | number>;
};

export type VisaPipelineStatus = {
  lodged_this_week: number;
  total_refused: number;
  total_processing: number;
  pending_s56: number;
  pending_biometrics: number;
  pending_medicals: number;
  pending_other: number;
};

export type StudyCentrePipelineStage = {
  stage: string;
  count: number;
};

export type StudyCentreAvgDays = {
  period: Date;
  avg_days_reg_to_offer: number;
  avg_days_offer_to_first_payment: number;
};
