import type { Brand } from './index';

export type MarketingPlanStatus = 'draft' | 'proposed' | 'approved' | 'complete' | 'needs-confirmation';
export type MarketingObjectiveStatus = MarketingPlanStatus | 'tbc';
export type MarketingObjectivePriority = 'high' | 'medium' | 'low' | 'tbc';
export type MarketingMilestoneLevel = 'quarterly-outcome' | 'monthly-milestone' | 'current-focus';
export type MarketingMilestoneStatus = MarketingObjectiveStatus | 'in-progress';
export type MarketingAttentionType = 'decision-required' | 'review-required' | 'approval-required' | 'missing-information';

export interface MarketingPlan {
  id: string;
  title: string;
  periodYear: number;
  businessDirection: string;
  status: MarketingPlanStatus;
  nextReviewDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export interface MarketingPlanObjective {
  id: string;
  planId: string;
  title: string;
  description: string;
  status: MarketingObjectiveStatus;
  priority: MarketingObjectivePriority;
  periodYear: number;
  quarter: number | null;
  whyItMatters: string;
  customerMarketContext: string;
  commercialRelevance: string;
  marketingRationale: string;
  nextReviewDate: string | null;
  sortOrder: number;
  notes: string;
  entities: Brand[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export interface MarketingPlanPriority {
  id: string;
  objectiveId: string;
  title: string;
  description: string;
  status: MarketingObjectiveStatus;
  sortOrder: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export interface MarketingPlanMilestone {
  id: string;
  objectiveId: string;
  priorityId: string | null;
  level: MarketingMilestoneLevel;
  title: string;
  description: string;
  status: MarketingMilestoneStatus;
  periodYear: number | null;
  quarter: number | null;
  month: number | null;
  startDate: string | null;
  dueDate: string | null;
  attentionType: MarketingAttentionType | null;
  sortOrder: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export interface MarketingPlanCampaignLink {
  id: string;
  objectiveId: string;
  priorityId: string | null;
  campaignId: string;
  sortOrder: number;
  createdAt: string;
  campaign: { name: string; status: string | null; archived: boolean } | null;
}

export interface MarketingPlanKpiDefinition {
  key: string;
  label: string;
  unit: 'count' | 'gbp' | 'percent';
  source: string;
  definition: string;
}

export interface MarketingPlanKpi {
  id: string;
  objectiveId: string;
  kpiKey: string;
  targetValue: number | null;
  targetUnit: string | null;
  targetDirection: 'increase' | 'decrease' | 'maintain' | 'reach';
  targetStatus: 'tbc' | 'proposed' | 'approved';
  periodScope: 'objective' | 'quarter' | 'month' | 'all-time';
  sortOrder: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
