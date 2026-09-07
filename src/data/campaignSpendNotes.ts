// What a campaign's manually-recorded spend actually represents — static
// reference data, not a database field, keyed to real campaign ids. Same
// reasoning as campaignPlans.ts's CAMPAIGN_PLAN_MARKDOWN: there is no live
// field carrying this context yet, and it must never be guessed or
// inferred from the number alone — only added here once a real person has
// confirmed what the figure is for. A campaign with no entry here just
// falls back to the generic "Manually logged" subtitle.
export const CAMPAIGN_SPEND_NOTE: Record<string, string> = {
  // Confirmed directly by Emilee: the cost of purchased education-sector
  // data for this campaign's outreach.
  'campaign-ggzz19_80Y': 'Purchased education data',
};
