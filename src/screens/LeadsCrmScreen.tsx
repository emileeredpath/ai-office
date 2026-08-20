import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { AttributionHealth } from '@/components/leads/AttributionHealth';
import { LeadCrmTable } from '@/components/leads/LeadCrmTable';
import { filterCampaignsByPeriod, sumLeads, sumEnquiries } from '@/utils/campaignMetrics';

interface LeadsCrmScreenProps {
  onNavigate?: (screen: string) => void;
}

// The commercial-attribution page: Campaign -> Lead -> Opportunity ->
// Pipeline -> Won Revenue. Acumatica will eventually be the source of
// truth for the CRM side of that flow; today only the campaign-level
// Marketing Leads and Enquiries aggregates are real. Everything CRM-shaped
// (Qualified Leads, Opportunities, Pipeline, Won Deals, Won Revenue,
// Attribution Health, the lead table itself) is an honest "Not connected"
// — never a fabricated figure, row, or health indicator.
export function LeadsCrmScreen({ onNavigate }: LeadsCrmScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const freshnessEntries: FreshnessEntry[] = [{ label: 'Acumatica', status: 'not-connected', detail: 'Not connected' }];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Leads & CRM</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Commercial attribution across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged - not CRM linked" accent="var(--v2-green)" />
          <KpiCard title="Qualified Leads" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Deals" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
        </div>

        {/* Attribution Health */}
        <div className="mb-8">
          <h2 className="v2-section-title">Attribution Health</h2>
          <div className="card">
            <AttributionHealth />
          </div>
        </div>

        {/* Current Marketing Activity — the one genuinely real, useful
            thing this page can show today, clearly distinguished from CRM
            data. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Current Marketing Activity</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Manually logged campaign activity — not CRM data.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard title="Enquiries" value={enquiriesTotal} subtitle="Manually logged per campaign" size="compact" />
            <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged per campaign" accent="var(--v2-green)" size="compact" />
          </div>
        </div>

        {/* Lead / CRM table */}
        <div className="mb-4">
          <h2 className="v2-section-title">Lead / CRM Records</h2>
          <div className="card" style={{ padding: 0 }}>
            <LeadCrmTable onViewPerformance={() => onNavigate?.('dashboard')} />
          </div>
        </div>
      </div>
    </div>
  );
}
