import { KpiCard } from '@/components/common/KpiCard';
import type { UnmatchedCampaign } from '@/utils/attributionHealth';
import type { AttributionGap } from '@/utils/attributionHealth';
import { BRAND_LABEL } from '@/utils/brandColors';

// Genuine, computed Unmatched Activity — distinct from the CRM-shaped
// Attribution Health tiles above it (those are Acumatica-pending stubs;
// this is real data the app already has, just not yet connected to a
// campaign). See src/utils/attributionHealth.ts for exactly how each
// figure is derived, and DATA_INTEGRITY.md for why "not-applicable"
// sources are shown honestly rather than hidden or faked as zero.
interface UnmatchedActivityProps {
  unmappedEmailSends: AttributionGap;
  unclassifiedCalls: AttributionGap;
  googleAdsGap: AttributionGap;
  ga4EnquiryGap: AttributionGap;
  spendGap: AttributionGap;
  campaignsWithNoActivity: UnmatchedCampaign[];
}

function gapValue(gap: AttributionGap): { value: number | string | undefined; status: 'available' | 'not-connected' } {
  if (gap.status === 'not-applicable') return { value: 'N/A', status: 'available' };
  if (gap.status === 'not-connected') return { value: undefined, status: 'not-connected' };
  return { value: gap.count ?? undefined, status: 'available' };
}

export function UnmatchedActivity({
  unmappedEmailSends,
  unclassifiedCalls,
  googleAdsGap,
  ga4EnquiryGap,
  spendGap,
  campaignsWithNoActivity,
}: UnmatchedActivityProps) {
  const emailTile = gapValue(unmappedEmailSends);
  const callsTile = gapValue(unclassifiedCalls);
  const adsTile = gapValue(googleAdsGap);
  const ga4Tile = gapValue(ga4EnquiryGap);
  const spendTile = gapValue(spendGap);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <KpiCard title="Unmapped emails" value={emailTile.value} status={emailTile.status} subtitle={unmappedEmailSends.subtitle} size="compact" />
        <KpiCard title="Unclassified calls" value={callsTile.value} status={callsTile.status} subtitle={unclassifiedCalls.subtitle} size="compact" />
        <KpiCard title="Unmapped Ads campaigns" value={adsTile.value} status={adsTile.status} subtitle={googleAdsGap.subtitle} size="compact" />
        <KpiCard title="GA4 enquiries unlinked" value={ga4Tile.value} status={ga4Tile.status} subtitle={ga4EnquiryGap.subtitle} size="compact" />
        <KpiCard title="Spend, no campaign" value={spendTile.value} status={spendTile.status} subtitle={spendGap.subtitle} size="compact" />
        <KpiCard title="No activity" value={campaignsWithNoActivity.length} status="available" subtitle="No linked sends/calls and every logged figure is zero" size="compact" />
      </div>

      {campaignsWithNoActivity.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {campaignsWithNoActivity.map((c) => (
                <tr key={c.id}>
                  <td className="text-text-primary">{c.name}</td>
                  <td className="text-text-secondary">{BRAND_LABEL[c.brand] ?? c.brand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
