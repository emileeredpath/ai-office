import { Campaign, Brand } from '@/types/index';
import { isWave1Campaign } from '@/utils/wave1';
import type { Wave1PerformanceData } from '@/store/useAppStore';

// Legacy Wave 1 snapshot helper, retained for compatibility but no longer
// consumed by Overview or Performance. General calls use callPerformance.ts
// with infinityCalls, the selected reporting period and confirmed entities.
//
// Email figures used to live here too (getEmailSnapshot), but the Campaign
// Monitor V2 audit found it summed every email-send task regardless of
// `source` — silently blending real Campaign Monitor sends with seed/test
// fixture rows, and never respecting the Period selector. Email now has
// its own shared layer, src/utils/emailPerformance.ts, backed by a
// read-only endpoint that only ever returns source === 'campaign-monitor'
// rows for a genuine calendar date range.

export interface CallsSnapshot {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: string;
}

// Legacy display gating by the Wave 1 campaign's primary brand. This is
// not deterministic call-to-campaign attribution: the legacy backend
// snapshot aggregates default-window calls before assigning the campaign.
// Do not use this helper for general period/entity reporting.
export function getCallsSnapshot(
  campaigns: Campaign[],
  wave1Performance: Wave1PerformanceData | null,
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean
): CallsSnapshot | null {
  const wave1TargetCampaign = campaigns.find(isWave1Campaign);
  const infinityConfigured = wave1Performance?.infinityConfigured === true;
  const infinityMatchesEntity = wave1TargetCampaign ? matchesSelectedEntity(wave1TargetCampaign.brand) : false;
  if (infinityConfigured && infinityMatchesEntity && wave1Performance?.infinity) {
    return wave1Performance.infinity;
  }
  return null;
}
