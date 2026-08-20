import { KpiCard } from '@/components/common/KpiCard';

// Makes the future attribution architecture visible without measuring
// anything that doesn't exist yet. No 0s, no percentages, no green/red
// health indicators — there is no lead- or opportunity-level dataset to
// assess today, so every metric is an honest "Not connected", same as the
// rest of this page.
export function AttributionHealth() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Campaign-coded leads" status="not-connected" subtitle="No lead records to assess" size="compact" />
        <KpiCard title="Leads missing campaign code" status="not-connected" subtitle="No lead records to assess" size="compact" />
        <KpiCard title="Opportunities linked to campaign" status="not-connected" subtitle="No opportunity records to assess" size="compact" />
        <KpiCard title="Revenue attributed to marketing" status="not-connected" subtitle="No revenue records to assess" size="compact" />
      </div>
      <p className="text-xs text-text-secondary mt-3">
        Attribution health will become available once lead and opportunity records are synced from Acumatica and
        campaigns have a reliable CRM attribution identifier.
      </p>
    </div>
  );
}
