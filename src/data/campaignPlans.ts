import q3AugustMarketingPlan from './campaignPlans/q3-august-marketing-plan-2026.md?raw';
import accountManagerEmailProgrammePlan from './campaignPlans/account-manager-email-programme-plan-2026.md?raw';
import ppcCampaignRestructurePlan from './campaignPlans/ppc-campaign-restructure-plan-2026.md?raw';
import axonBodycamCampaignPlan from './campaignPlans/axon-bodycam-campaign-plan-2026.md?raw';

// Original plan documents are static reference files, not database rows —
// see the Campaign Plan Integration brief. Keyed by campaign ID so the Plan
// tab can look one up for whichever campaign is currently open. A campaign
// with no entry here just shows an empty state, not an error.
export const CAMPAIGN_PLAN_MARKDOWN: Record<string, string> = {
  'campaign-KGZC9_Vlev': q3AugustMarketingPlan,
  'campaign-2': accountManagerEmailProgrammePlan,
  'campaign-1': ppcCampaignRestructurePlan,
  'campaign-7cfqxgCdTa': axonBodycamCampaignPlan,
};
