import { Campaign, Brand } from '@/types/index';
import { isWave1Campaign } from '@/utils/wave1';
import type { Wave1PerformanceData } from '@/store/useAppStore';

// Shared channel-snapshot logic used by both Overview's "Channel Snapshot"
// and Performance's "Channel Summary" — pure extraction of the logic that
// previously lived inline in HomeScreen, so the two pages read the exact
// same real figures and can never disagree.
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

// Infinity's real data today is scoped to one hardcoded campaign (see
// isWave1Campaign) — only surface it if that campaign actually belongs to
// the currently-selected entity, otherwise it would silently show another
// entity's figure under the wrong selection.
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
