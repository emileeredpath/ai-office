import type { Brand } from './index';

export type MarketingPlanStatus = 'draft' | 'proposed' | 'approved' | 'complete' | 'needs-confirmation';
export type MarketingObjectiveStatus = MarketingPlanStatus | 'tbc';
export type MarketingObjectivePriority = 'high' | 'medium' | 'low' | 'tbc';

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
