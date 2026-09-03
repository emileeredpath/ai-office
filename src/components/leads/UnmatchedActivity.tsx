import { useState } from 'react';
import { KpiCard } from '@/components/common/KpiCard';
import type { UnmatchedCampaign } from '@/utils/attributionHealth';
import type { AttributionGap } from '@/utils/attributionHealth';
import type { UnmatchedGoogleAdsCampaign } from '@/utils/campaignAttribution';
import type { Campaign } from '@/types/index';
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
  // Manual Google Ads -> AI Office campaign mapping (Campaign Attribution
  // phase, slice 2) — only rendered when all three are provided (edit-role
  // sessions). Mapping stores the real, stable Google Ads campaign ID (not
  // its display name) onto the chosen AI Office campaign's own
  // googleAdsCampaignIds — additive only, so an existing mapping (this
  // campaign's own or another campaign's) is never overwritten, and this
  // never creates a new AI Office campaign.
  unmatchedGoogleAdsCampaigns?: UnmatchedGoogleAdsCampaign[];
  campaigns?: Campaign[];
  isEditor?: boolean;
  onMapGoogleAdsCampaign?: (aiCampaignId: string, googleAdsCampaignId: string) => Promise<void>;
}

function gapValue(gap: AttributionGap): { value: number | string | undefined; status: 'available' | 'not-connected' } {
  if (gap.status === 'not-applicable') return { value: 'N/A', status: 'available' };
  if (gap.status === 'not-connected') return { value: undefined, status: 'not-connected' };
  return { value: gap.count ?? undefined, status: 'available' };
}

function GoogleAdsMappingRow({
  row,
  campaigns,
  onMap,
}: {
  row: UnmatchedGoogleAdsCampaign;
  campaigns: Campaign[];
  onMap: (aiCampaignId: string, googleAdsCampaignId: string) => Promise<void>;
}) {
  const [selection, setSelection] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMap = async () => {
    if (!selection) return;
    setSaving(true);
    setError(null);
    try {
      await onMap(selection, row.campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this mapping.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className="text-text-primary">{row.campaignName}</td>
      <td className="text-text-secondary">{BRAND_LABEL[row.brand] ?? row.brand}</td>
      <td style={{ textAlign: 'right' }}>£{row.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</td>
      <td>
        <div className="flex items-center gap-2">
          <select className="input text-sm" value={selection} onChange={(e) => setSelection(e.target.value)} disabled={saving}>
            <option value="">Select AI Office campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary text-sm" onClick={handleMap} disabled={saving || !selection}>
            {saving ? 'Saving…' : 'Map'}
          </button>
        </div>
        {error && <p className="text-xs mt-1" style={{ color: 'var(--v2-red)' }}>{error}</p>}
      </td>
    </tr>
  );
}

export function UnmatchedActivity({
  unmappedEmailSends,
  unclassifiedCalls,
  googleAdsGap,
  ga4EnquiryGap,
  spendGap,
  campaignsWithNoActivity,
  unmatchedGoogleAdsCampaigns,
  campaigns,
  isEditor,
  onMapGoogleAdsCampaign,
}: UnmatchedActivityProps) {
  const emailTile = gapValue(unmappedEmailSends);
  const callsTile = gapValue(unclassifiedCalls);
  const adsTile = gapValue(googleAdsGap);
  const ga4Tile = gapValue(ga4EnquiryGap);
  const spendTile = gapValue(spendGap);

  const canMapGoogleAds = isEditor && campaigns && onMapGoogleAdsCampaign;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <KpiCard title="Unmapped emails" value={emailTile.value} status={emailTile.status} subtitle={unmappedEmailSends.subtitle} size="compact" />
        <KpiCard title="Unclassified calls" value={callsTile.value} status={callsTile.status} subtitle={unclassifiedCalls.subtitle} size="compact" />
        <KpiCard title="Unmapped Ads campaigns" value={adsTile.value} status={adsTile.status} subtitle={googleAdsGap.subtitle} size="compact" />
        <KpiCard title="GA4 campaigns unlinked" value={ga4Tile.value} status={ga4Tile.status} subtitle={ga4EnquiryGap.subtitle} size="compact" />
        <KpiCard title="Spend, no campaign" value={spendTile.value} status={spendTile.status} subtitle={spendGap.subtitle} size="compact" />
        <KpiCard title="No activity" value={campaignsWithNoActivity.length} status="available" subtitle="No linked sends/calls and every logged figure is zero" size="compact" />
      </div>

      {unmatchedGoogleAdsCampaigns && unmatchedGoogleAdsCampaigns.length > 0 && (
        <div className="card mb-4" style={{ padding: 0 }}>
          <div className="px-4 pt-4">
            <h4 className="text-sm font-semibold text-text-primary">Unmapped Google Ads campaigns</h4>
            <p className="text-xs text-text-secondary mb-2">
              Real Google Ads campaigns with no AI Office campaign mapped this period.
              {canMapGoogleAds ? ' Map one below — this stores the real Google Ads campaign ID and never overwrites an existing mapping.' : ''}
            </p>
          </div>
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th>Google Ads Campaign</th>
                <th>Entity</th>
                <th style={{ textAlign: 'right' }}>Spend</th>
                {canMapGoogleAds && <th>Map to campaign</th>}
              </tr>
            </thead>
            <tbody>
              {unmatchedGoogleAdsCampaigns.map((row) =>
                canMapGoogleAds ? (
                  <GoogleAdsMappingRow key={row.campaignId} row={row} campaigns={campaigns!} onMap={onMapGoogleAdsCampaign!} />
                ) : (
                  <tr key={row.campaignId}>
                    <td className="text-text-primary">{row.campaignName}</td>
                    <td className="text-text-secondary">{BRAND_LABEL[row.brand] ?? row.brand}</td>
                    <td style={{ textAlign: 'right' }}>£{row.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

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
