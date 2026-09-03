import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { AttributionHealth } from '@/components/leads/AttributionHealth';
import { UnmatchedActivity } from '@/components/leads/UnmatchedActivity';
import { LeadCrmTable } from '@/components/leads/LeadCrmTable';
import { filterCampaignsByPeriod, sumLeads, sumEnquiries, MARKETING_LEADS_CAVEAT } from '@/utils/campaignMetrics';
import { resolveEmailDateRange } from '@/utils/emailPerformance';
import { resolveCallDateRange } from '@/utils/callPerformance';
import {
  getUnmappedEmailSends,
  getUnclassifiedCalls,
  getCampaignsWithNoActivity,
  SPEND_WITHOUT_CAMPAIGN_GAP,
} from '@/utils/attributionHealth';
import { getUnmatchedGoogleAdsCampaigns, getUnmatchedGa4Campaigns } from '@/utils/campaignAttribution';
import { resolveGoogleAdsDateRange } from '@/utils/googleAdsPerformance';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { fetchGa4CampaignNamesInUse } from '@/services/ga4Api';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import type { Brand } from '@/types/index';

const GA4_BRANDS: Brand[] = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'];

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
  const tasks = useAppStore((s) => s.tasks);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();
  const { isEditor } = useAuth();

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  const callRange = useMemo(() => resolveCallDateRange(period), [period]);
  useEffect(() => {
    syncInfinityCalls(callRange.startDate, callRange.endDate);
  }, [callRange.startDate, callRange.endDate, syncInfinityCalls]);

  const googleAdsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);
  useEffect(() => {
    syncGoogleAdsPerformance(googleAdsRange.startDate, googleAdsRange.endDate);
  }, [googleAdsRange.startDate, googleAdsRange.endDate, syncGoogleAdsPerformance]);

  // Real gap, not a static placeholder — every real Google Ads campaign
  // this period whose ID isn't mapped to any AI Office campaign. See
  // getUnmatchedGoogleAdsCampaigns's doc comment.
  const unmatchedGoogleAdsCampaigns = useMemo(
    () => getUnmatchedGoogleAdsCampaigns(googleAdsPerformance, campaigns),
    [googleAdsPerformance, campaigns]
  );
  const googleAdsGap = useMemo(() => {
    if (!googleAdsPerformance || !googleAdsPerformance.configured) {
      return { status: 'not-connected' as const, count: null, subtitle: 'Google Ads is not connected' };
    }
    return {
      status: 'available' as const,
      count: unmatchedGoogleAdsCampaigns.length,
      subtitle: unmatchedGoogleAdsCampaigns.length > 0 ? 'Real Google Ads campaigns with no AI Office campaign mapped' : 'Every Google Ads campaign this period is mapped',
    };
  }, [googleAdsPerformance, unmatchedGoogleAdsCampaigns]);

  // Manual Google Ads -> AI Office campaign mapping — additive only:
  // appends this real Google Ads campaign ID to the chosen campaign's own
  // googleAdsCampaignIds, so an existing mapping (on this campaign or any
  // other) is never overwritten, and no AI Office campaign is ever created
  // here. See UnmatchedActivity's doc comment.
  const handleMapGoogleAdsCampaign = async (aiCampaignId: string, googleAdsCampaignId: string) => {
    const target = campaigns.find((c) => c.id === aiCampaignId);
    if (!target) throw new Error('Campaign not found.');
    const existingIds = target.googleAdsCampaignIds ?? [];
    if (existingIds.includes(googleAdsCampaignId)) return;
    await updateCampaign(aiCampaignId, { googleAdsCampaignIds: [...existingIds, googleAdsCampaignId] });
  };

  // Genuine GA4 attribution gap — a discrete list IS identifiable here
  // (sessionCampaignName breakdown, no filter), unlike per-enquiry-record
  // linking which remains genuinely unavailable. Fetched per brand this
  // period; a brand with no GA4 property configured just contributes
  // nothing (never treated as "no gap"). See
  // getUnmatchedGa4Campaigns's doc comment.
  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  const [ga4NamesInUse, setGa4NamesInUse] = useState<Partial<Record<Brand, string[]>>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      GA4_BRANDS.map((brand) =>
        fetchGa4CampaignNamesInUse(brand, ga4Range.startDate, ga4Range.endDate)
          .then((res) => [brand, res] as const)
          .catch(() => [brand, null] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      const next: Partial<Record<Brand, string[]>> = {};
      for (const [brand, res] of results) {
        if (res && res.configured) next[brand] = res.campaignNames;
      }
      setGa4NamesInUse(next);
    });
    return () => {
      cancelled = true;
    };
  }, [ga4Range.startDate, ga4Range.endDate]);

  const unmatchedGa4Campaigns = useMemo(() => getUnmatchedGa4Campaigns(ga4NamesInUse, campaigns), [ga4NamesInUse, campaigns]);
  const ga4EnquiryGap = useMemo(() => {
    if (Object.keys(ga4NamesInUse).length === 0) {
      return { status: 'not-connected' as const, count: null, subtitle: 'GA4 is not connected' };
    }
    return {
      status: 'available' as const,
      count: unmatchedGa4Campaigns.length,
      subtitle: unmatchedGa4Campaigns.length > 0 ? 'Real GA4 campaigns with traffic this period but no AI Office campaign mapped' : 'Every GA4 campaign with traffic this period is mapped',
    };
  }, [ga4NamesInUse, unmatchedGa4Campaigns]);

  // Genuine commercial KPIs from the last manually-imported Acumatica
  // export (Discovery & Foundation phase) — never live. Respects the
  // shared Period selector and the selected entity the same way every
  // other integration on this page does: group view queries across every
  // entity, a specific entity filters server-side by its own brand.
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const [acumaticaSummary, setAcumaticaSummary] = useState<AcumaticaSummary | null>(null);
  useEffect(() => {
    const startDate = periodStart ? periodStart.toISOString().slice(0, 10) : undefined;
    const endDate = periodStart ? new Date().toISOString().slice(0, 10) : undefined;
    const brand = isGroupView || selectedEntity === 'all' ? undefined : selectedEntity;
    fetchAcumaticaSummary(startDate, endDate, brand).then(setAcumaticaSummary).catch(() => setAcumaticaSummary(null));
  }, [periodStart, isGroupView, selectedEntity]);

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);

  // ---- Unmatched Activity — see src/utils/attributionHealth.ts ----------
  const unmappedEmailSends = useMemo(
    () => getUnmappedEmailSends(emailPerformance, matchesSelectedEntity),
    [emailPerformance, matchesSelectedEntity]
  );
  const unclassifiedCalls = useMemo(
    () => getUnclassifiedCalls(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const campaignsWithNoActivity = useMemo(
    () => getCampaignsWithNoActivity(periodCampaigns, tasks.filter((t) => matchesSelectedEntity(t.brand))),
    [periodCampaigns, tasks, matchesSelectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  // Campaign Monitor and Infinity are now synced on this page too (they
  // feed Unmatched Activity below), so their real connection state is
  // shown here rather than leaving Acumatica as the only entry, which
  // would understate what this page actually reads from.
  const cmConfigured = emailPerformance?.configured === true;
  const infinityConfigured = infinityCalls?.configured === true;
  const freshnessEntries: FreshnessEntry[] = [
    cmConfigured
      ? { label: 'Campaign Monitor', status: emailPerformance?.syncState === 'live' ? 'live' : 'error', detail: emailPerformance?.syncState === 'live' ? 'Connected' : 'Sync error' }
      : { label: 'Campaign Monitor', status: 'not-connected', detail: 'Not connected' },
    infinityConfigured
      ? { label: 'Infinity', status: 'live', detail: 'Connected' }
      : { label: 'Infinity', status: 'not-connected', detail: 'Not connected' },
    acumaticaSummary?.hasImportedData
      ? {
          label: 'Acumatica',
          status: 'stale',
          detail: acumaticaSummary.lastImportedAt
            ? `Manual export — last imported ${new Date(acumaticaSummary.lastImportedAt).toLocaleDateString('en-GB')}`
            : 'Manual export',
        }
      : { label: 'Acumatica', status: 'not-connected', detail: 'Not connected — no manual export imported yet' },
  ];

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
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle={MARKETING_LEADS_CAVEAT} accent="var(--v2-green)" />
          <KpiCard title="Qualified Leads" status="not-connected" subtitle="No lead-level data in the Acumatica export" />
          <KpiCard
            title="Opportunities"
            value={acumaticaSummary?.hasImportedData ? acumaticaSummary.opportunities : undefined}
            status={acumaticaSummary?.hasImportedData ? 'available' : 'not-connected'}
            subtitle={acumaticaSummary?.hasImportedData ? 'Manual Acumatica export — see Settings for last import' : 'No Acumatica export imported yet'}
          />
          <KpiCard
            title="Open Pipeline"
            value={acumaticaSummary?.hasImportedData ? `£${Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}` : undefined}
            status={acumaticaSummary?.hasImportedData ? 'available' : 'not-connected'}
            subtitle={acumaticaSummary?.hasImportedData ? `${acumaticaSummary.openPipelineCount} open opportunit${acumaticaSummary.openPipelineCount === 1 ? 'y' : 'ies'} — manual Acumatica export` : 'No Acumatica export imported yet'}
          />
          <KpiCard
            title="Won Deals"
            value={acumaticaSummary?.hasImportedData ? acumaticaSummary.wonDeals : undefined}
            status={acumaticaSummary?.hasImportedData ? 'available' : 'not-connected'}
            subtitle={acumaticaSummary?.hasImportedData ? 'Manual Acumatica export' : 'No Acumatica export imported yet'}
          />
          <KpiCard
            title="Won Revenue"
            value={acumaticaSummary?.hasImportedData ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined}
            status={acumaticaSummary?.hasImportedData ? 'available' : 'not-connected'}
            subtitle={acumaticaSummary?.hasImportedData ? 'Manual Acumatica export' : 'No Acumatica export imported yet'}
          />
        </div>

        {/* Attribution Health — CRM-side (Acumatica-pending, all "Not
            connected" today) */}
        <div className="mb-8">
          <h2 className="v2-section-title">Attribution Health</h2>
          <div className="card">
            <AttributionHealth />
          </div>
        </div>

        {/* Unmatched Activity — genuine, computed today from data AI
            Office already has (Campaign Monitor sends, Infinity calls,
            campaign records). Distinct from the CRM-side Attribution
            Health above: this never depends on Acumatica. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Unmatched Activity</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real activity that isn't confidently linked to an AI Office campaign — using only the existing,
            deterministic links each integration already computes. Nothing here is a weak or inferred match; where
            a source has no linkage mechanism at all yet, that's shown as "N/A", never guessed.
          </p>
          <UnmatchedActivity
            unmappedEmailSends={unmappedEmailSends}
            unclassifiedCalls={unclassifiedCalls}
            googleAdsGap={googleAdsGap}
            ga4EnquiryGap={ga4EnquiryGap}
            spendGap={SPEND_WITHOUT_CAMPAIGN_GAP}
            campaignsWithNoActivity={campaignsWithNoActivity}
            unmatchedGoogleAdsCampaigns={unmatchedGoogleAdsCampaigns}
            campaigns={campaigns}
            isEditor={isEditor}
            onMapGoogleAdsCampaign={handleMapGoogleAdsCampaign}
          />
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
