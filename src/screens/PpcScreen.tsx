import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { PpcCampaignTable } from '@/components/ppc/PpcCampaignTable';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary, getGoogleAdsCampaigns, getCostPerGa4Enquiry } from '@/utils/googleAdsPerformance';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';

// PPC — the primary Google Ads reporting page (Phase 1). Real campaign
// performance for Brentwood and Radio Links only, confirmed live against
// both real accounts (see backend/src/services/googleAds.ts's header
// comment). Capcom and Irish Radio have no Google Ads account and stay
// honestly "Not connected" — never a fabricated 0. GA4 Enquiries appears
// alongside Google Ads' own conversions metric as a deliberately separate
// figure — the two are never the same population, and Cost per GA4
// Enquiry combines real Google Ads spend with real GA4 Enquiries for the
// same entity/period, never assuming Google Ads conversions equal GA4
// Enquiries. Marketing Leads, Opportunities, Pipeline, Won Revenue and
// ROAS still require CRM attribution from Acumatica and remain honestly
// "Not connected" in the Commercial section below.
export function PpcScreen() {
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();

  const googleAdsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);
  useEffect(() => {
    syncGoogleAdsPerformance(googleAdsRange.startDate, googleAdsRange.endDate);
  }, [googleAdsRange.startDate, googleAdsRange.endDate, syncGoogleAdsPerformance]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  const googleAds = useMemo(
    () => getGoogleAdsSummary(googleAdsPerformance, isGroupView, selectedEntity),
    [googleAdsPerformance, isGroupView, selectedEntity]
  );
  const campaigns = useMemo(
    () => getGoogleAdsCampaigns(googleAdsPerformance, isGroupView, selectedEntity),
    [googleAdsPerformance, isGroupView, selectedEntity]
  );
  const enquiries = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const costPerEnquiry = useMemo(
    () => getCostPerGa4Enquiry(googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity),
    [googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const googleAdsConfigured = googleAdsPerformance?.configured === true;
  const googleAdsHasErrors = (googleAdsPerformance?.errors?.length ?? 0) > 0;

  const freshnessEntries: FreshnessEntry[] = [
    googleAdsConfigured
      ? { label: 'Google Ads', status: googleAdsHasErrors ? 'error' : 'live', detail: googleAdsHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'Google Ads', status: 'not-connected', detail: 'Not connected' },
    { label: 'Acumatica CRM', status: 'not-connected', detail: 'Not connected' },
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">PPC</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Real Google Ads performance across connected MTech Group entities' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="mb-8">
          <h2 className="v2-section-title">Google Ads Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Spend"
              value={googleAds.status === 'available' ? `£${googleAds.spend!.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
            />
            <KpiCard
              title="Impressions"
              value={googleAds.status === 'available' ? googleAds.impressions!.toLocaleString('en-GB') : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
            />
            <KpiCard
              title="Clicks"
              value={googleAds.status === 'available' ? googleAds.clicks!.toLocaleString('en-GB') : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
            />
            <KpiCard
              title="CTR"
              value={googleAds.status === 'available' && googleAds.ctr != null ? `${googleAds.ctr}%` : undefined}
              status={googleAds.status === 'available' && googleAds.ctr != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Clicks ÷ Impressions' : googleAds.subtitle}
            />
            <KpiCard
              title="Average CPC"
              value={googleAds.status === 'available' && googleAds.averageCpc != null ? `£${googleAds.averageCpc.toFixed(2)}` : undefined}
              status={googleAds.status === 'available' && googleAds.averageCpc != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Spend ÷ Clicks' : googleAds.subtitle}
            />
            <KpiCard
              title="Google Ads Conversions"
              value={googleAds.status === 'available' ? googleAds.conversions : undefined}
              status={googleAds.status}
              subtitle={googleAds.status === 'available' ? "Google Ads' own conversions metric — not GA4 Enquiries" : googleAds.subtitle}
            />
            <KpiCard
              title="Cost per Google Ads Conversion"
              value={googleAds.status === 'available' && googleAds.costPerConversion != null ? `£${googleAds.costPerConversion.toFixed(2)}` : undefined}
              status={googleAds.status === 'available' && googleAds.costPerConversion != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Spend ÷ Google Ads Conversions' : googleAds.subtitle}
            />
            <KpiCard
              title="GA4 Enquiries"
              value={enquiries.status === 'available' ? enquiries.total : undefined}
              status={enquiries.status}
              subtitle={enquiries.status === 'available' ? 'Verified GA4 key events — a separate measurement from Google Ads Conversions' : enquiries.subtitle}
              accent="var(--v2-green)"
            />
            <KpiCard
              title="Cost per GA4 Enquiry"
              value={costPerEnquiry.status === 'available' && costPerEnquiry.costPerEnquiry != null ? `£${costPerEnquiry.costPerEnquiry.toFixed(2)}` : undefined}
              status={costPerEnquiry.status === 'available' && costPerEnquiry.costPerEnquiry != null ? 'available' : 'not-connected'}
              subtitle={costPerEnquiry.status === 'available' ? costPerEnquiry.subtitle : costPerEnquiry.subtitle}
              accent="var(--v2-green)"
            />
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="mb-8">
          <h2 className="v2-section-title">Campaign Performance</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real Google Ads campaigns, shown exactly as returned — never matched to a dashboard campaign record.
          </p>
          <div className="card" style={{ padding: 0 }}>
            <PpcCampaignTable campaigns={campaigns} showEntityColumn={isGroupView} />
          </div>
        </div>

        {/* Commercial — still pending Acumatica */}
        <div className="mb-4">
          <h2 className="v2-section-title">Commercial</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Marketing Leads" status="not-connected" subtitle="Requires CRM attribution" size="compact" />
            <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" size="compact" />
            <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" size="compact" />
            <KpiCard title="ROAS" status="not-connected" subtitle="Requires Acumatica revenue attribution" size="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
