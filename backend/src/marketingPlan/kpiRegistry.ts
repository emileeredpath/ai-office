export const MARKETING_PLAN_KPI_REGISTRY = [
  { key: 'website-users', label: 'Website Users', unit: 'count', source: 'GA4', destination: 'website', definition: 'GA4 activeUsers for the selected entity and period.' },
  { key: 'sessions', label: 'Sessions', unit: 'count', source: 'GA4', destination: 'website', definition: 'GA4 sessions for the selected entity and period.' },
  { key: 'ga4-enquiries', label: 'GA4 Enquiries', unit: 'count', source: 'GA4 verified key events', destination: 'website', definition: 'Verified website conversion actions for supported entities.' },
  { key: 'campaign-enquiries', label: 'Enquiries', unit: 'count', source: 'Manual campaign results', destination: 'campaigns', definition: 'Manually entered campaign enquiriesReceived, kept distinct from GA4 Enquiries.' },
  { key: 'marketing-leads', label: 'Marketing Leads', unit: 'count', source: 'Manual campaign results', destination: 'campaigns', definition: 'Manually entered campaign leads, not CRM verified.' },
  { key: 'opportunities', label: 'Opportunities', unit: 'count', source: 'Acumatica manual import', destination: 'leads', definition: 'Imported opportunities within the supported Created On scope.' },
  { key: 'won-deals', label: 'Won Deals', unit: 'count', source: 'Acumatica manual import', destination: 'leads', definition: 'Opportunities whose current Status is exactly Won.' },
  { key: 'won-revenue', label: 'Won Revenue', unit: 'gbp', source: 'Acumatica manual import', destination: 'leads', definition: 'Total for opportunities whose current Status is Won; no trustworthy Won Date is available.' },
  { key: 'open-pipeline', label: 'Open Pipeline', unit: 'gbp', source: 'Acumatica manual import', destination: 'leads', definition: 'Total for current Status Open plus Status New. Stage is never used.' },
  { key: 'google-ads-spend', label: 'Google Ads Spend', unit: 'gbp', source: 'Google Ads', destination: 'ppc', definition: 'Google Ads cost for the requested period.' },
  { key: 'known-campaign-spend', label: 'Known Campaign Spend', unit: 'gbp', source: 'Campaign costs and mapped Google Ads', destination: 'campaigns', definition: 'Fixed costs plus available Google Ads spend using explicit campaign mappings.' },
  { key: 'total-calls', label: 'Calls', unit: 'count', source: 'Infinity', destination: 'infinity', definition: 'Infinity calls using the confirmed entity mapping and existing phone masking.' },
] as const;

export type MarketingPlanKpiKey = (typeof MARKETING_PLAN_KPI_REGISTRY)[number]['key'];

export function getMarketingPlanKpiDefinition(key: string) {
  return MARKETING_PLAN_KPI_REGISTRY.find((item) => item.key === key);
}
