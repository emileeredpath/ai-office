import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { PpcJourney } from '@/components/ppc/PpcJourney';
import { PpcOverTimePanel } from '@/components/ppc/PpcOverTimePanel';
import { PpcCampaignTable } from '@/components/ppc/PpcCampaignTable';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';

const FRESHNESS_ENTRIES: FreshnessEntry[] = [
  { label: 'Google Ads', status: 'not-connected', detail: 'Not connected' },
  { label: 'Acumatica CRM', status: 'not-connected', detail: 'Not connected' },
];

// PPC is a major lead-generation channel for MTech, so this page is built
// as a primary commercial reporting area — not a generic "coming soon"
// screen — even though neither Google Ads nor Acumatica is connected yet.
// Every figure here is an honest "Not connected" state: there is no real
// PPC-specific data source anywhere in this app today (see the PPC V2
// analysis). Nothing is derived from generic campaign.spend/leads or
// manually-entered valueGenerated — those aren't genuinely attributable
// to the PPC channel, so using them here would misrepresent what's real.
export function PpcScreen() {
  const { isGroupView, selectedEntity } = useEntity();
  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">PPC</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Combined PPC performance across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={FRESHNESS_ENTRIES} />

        {/* Headline commercial KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Spend" status="not-connected" subtitle="Awaiting Google Ads integration" />
          <KpiCard title="Clicks" status="not-connected" subtitle="Awaiting Google Ads integration" />
          <KpiCard title="Marketing Leads" status="not-connected" subtitle="Requires Google Ads + CRM attribution" />
          <KpiCard title="Cost per Lead" status="not-connected" subtitle="Requires attributable PPC leads" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="ROAS" status="not-connected" subtitle="Requires Google Ads + Acumatica" />
        </div>

        {/* PPC journey / attribution */}
        <div className="mb-8">
          <h2 className="v2-section-title">Measurement Journey</h2>
          <div className="card">
            <PpcJourney />
          </div>
        </div>

        {/* Advertising Efficiency */}
        <div className="mb-8">
          <h2 className="v2-section-title">Advertising Efficiency</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Google Ads conversions measure advertising actions. Marketing Leads (above) represent genuine
            CRM-attributed leads — the two are never the same figure, before or after integration.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard title="Impressions" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
            <KpiCard title="CTR" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
            <KpiCard title="Average CPC" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
            <KpiCard title="Conversion Rate" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
            <KpiCard title="Cost per Conversion" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
          </div>
        </div>

        {/* Performance Over Time */}
        <div className="mb-8">
          <h2 className="v2-section-title">Performance Over Time</h2>
          <div className="card">
            <PpcOverTimePanel />
          </div>
        </div>

        {/* PPC Campaign Performance */}
        <div className="mb-4">
          <h2 className="v2-section-title">PPC Campaign Performance</h2>
          <div className="card" style={{ padding: 0 }}>
            <PpcCampaignTable />
          </div>
        </div>
      </div>
    </div>
  );
}
