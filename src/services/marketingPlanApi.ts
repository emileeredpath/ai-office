import { apiFetch, ApiError } from './apiConfig';
import type { MarketingPlan, MarketingPlanCampaignLink, MarketingPlanKpi, MarketingPlanKpiDefinition, MarketingPlanMilestone, MarketingPlanObjective, MarketingPlanPriority, MarketingPlanReview, MarketingPlanReviewEvidence, MarketingPlanStrategyObjective } from '@/types/marketingPlan';

export interface MarketingPlanHistoryEntry {
  id: string;
  resourceType: 'objective' | 'priority' | 'milestone' | 'campaign-link' | 'kpi';
  resourceId: string;
  action: string;
  reason: string | null;
  changedAt: string;
}

async function handle<T>(response: Response, action: string): Promise<T> {
  let body: { success?: boolean; result?: T; message?: string };
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`Unexpected response while trying to ${action}.`, response.status);
  }
  if (!response.ok || !body.success) throw new ApiError(body.message || `Could not ${action}.`, response.status);
  return body.result as T;
}

export const fetchMarketingPlans = () => apiFetch('/api/marketing-plan/plans').then((response) => handle<MarketingPlan[]>(response, 'load the marketing plan'));
export const createMarketingPlan = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/plans', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlan>(response, 'create the marketing plan'));
export const updateMarketingPlan = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlan>(response, 'update the marketing plan'));

export const fetchMarketingObjectives = (planId: string) => apiFetch(`/api/marketing-plan/plans/${planId}/objectives`).then((response) => handle<MarketingPlanObjective[]>(response, 'load marketing objectives'));
export const fetchMarketingStrategy = (planId: string) => apiFetch(`/api/marketing-plan/plans/${planId}/strategy`).then((response) => handle<MarketingPlanStrategyObjective[]>(response, 'load the strategy views'));
export const createMarketingObjective = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/objectives', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanObjective>(response, 'create the objective'));
export const updateMarketingObjective = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/objectives/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanObjective>(response, 'update the objective'));
export const archiveMarketingObjective = (id: string) => apiFetch(`/api/marketing-plan/objectives/${id}/archive`, { method: 'POST', body: '{}' }).then((response) => handle<MarketingPlanObjective>(response, 'archive the objective'));
export const fetchMarketingObjectiveHistory = (id: string) => apiFetch(`/api/marketing-plan/objectives/${id}/history`).then((response) => handle<MarketingPlanHistoryEntry[]>(response, 'load objective history'));

export const fetchMarketingPriorities = (objectiveId: string) => apiFetch(`/api/marketing-plan/objectives/${objectiveId}/priorities`).then((response) => handle<MarketingPlanPriority[]>(response, 'load strategic priorities'));
export const createMarketingPriority = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/priorities', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanPriority>(response, 'create the strategic priority'));
export const updateMarketingPriority = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/priorities/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanPriority>(response, 'update the strategic priority'));
export const archiveMarketingPriority = (id: string) => apiFetch(`/api/marketing-plan/priorities/${id}/archive`, { method: 'POST', body: '{}' }).then((response) => handle<MarketingPlanPriority>(response, 'archive the strategic priority'));
export const reorderMarketingPriorities = (objectiveId: string, ids: string[]) => apiFetch('/api/marketing-plan/priorities/reorder', { method: 'POST', body: JSON.stringify({ objectiveId, ids }) }).then((response) => handle<MarketingPlanPriority[]>(response, 'reorder strategic priorities'));

export const fetchMarketingMilestones = (objectiveId: string) => apiFetch(`/api/marketing-plan/objectives/${objectiveId}/milestones`).then((response) => handle<MarketingPlanMilestone[]>(response, 'load outcomes and milestones'));
export const createMarketingMilestone = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/milestones', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanMilestone>(response, 'create the milestone'));
export const updateMarketingMilestone = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanMilestone>(response, 'update the milestone'));
export const archiveMarketingMilestone = (id: string) => apiFetch(`/api/marketing-plan/milestones/${id}/archive`, { method: 'POST', body: '{}' }).then((response) => handle<MarketingPlanMilestone>(response, 'archive the milestone'));

export const fetchMarketingCampaignLinks = (objectiveId: string) => apiFetch(`/api/marketing-plan/objectives/${objectiveId}/campaign-links`).then((response) => handle<MarketingPlanCampaignLink[]>(response, 'load campaign relationships'));
export const createMarketingCampaignLink = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/campaign-links', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanCampaignLink>(response, 'link the campaign'));
export const deleteMarketingCampaignLink = (id: string) => apiFetch(`/api/marketing-plan/campaign-links/${id}`, { method: 'DELETE' }).then((response) => handle<MarketingPlanCampaignLink>(response, 'unlink the campaign'));

export const fetchMarketingKpiRegistry = () => apiFetch('/api/marketing-plan/kpis/registry').then((response) => handle<MarketingPlanKpiDefinition[]>(response, 'load KPI definitions'));
export const fetchMarketingKpis = (objectiveId: string) => apiFetch(`/api/marketing-plan/objectives/${objectiveId}/kpis`).then((response) => handle<MarketingPlanKpi[]>(response, 'load KPI relationships'));
export const createMarketingKpi = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/kpis', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanKpi>(response, 'link the KPI'));
export const updateMarketingKpi = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/kpis/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanKpi>(response, 'update the KPI target'));
export const deleteMarketingKpi = (id: string) => apiFetch(`/api/marketing-plan/kpis/${id}`, { method: 'DELETE' }).then((response) => handle<MarketingPlanKpi>(response, 'unlink the KPI'));

export const fetchMarketingReviews = (planId: string) => apiFetch(`/api/marketing-plan/plans/${planId}/reviews`).then((response) => handle<MarketingPlanReview[]>(response, 'load strategy reviews'));
export const createMarketingReview = (payload: Record<string, unknown>) => apiFetch('/api/marketing-plan/reviews', { method: 'POST', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanReview>(response, 'create the strategy review'));
export const updateMarketingReview = (id: string, payload: Record<string, unknown>) => apiFetch(`/api/marketing-plan/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => handle<MarketingPlanReview>(response, 'save the strategy review'));
export const archiveMarketingReview = (id: string) => apiFetch(`/api/marketing-plan/reviews/${id}/archive`, { method: 'POST', body: '{}' }).then((response) => handle<MarketingPlanReview>(response, 'archive the strategy review'));
export const replaceMarketingReviewEvidence = (id: string, evidence: Record<string, unknown>[]) => apiFetch(`/api/marketing-plan/reviews/${id}/evidence`, { method: 'POST', body: JSON.stringify({ evidence }) }).then((response) => handle<MarketingPlanReviewEvidence[]>(response, 'capture review evidence'));
