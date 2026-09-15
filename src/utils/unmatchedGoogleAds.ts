import type { Brand } from '@/types/index';
import type { UnmatchedGoogleAdsCampaign } from '@/utils/campaignAttribution';

export interface PrioritisedUnmatchedGoogleAds {
  withSpend: UnmatchedGoogleAdsCampaign[];
  zeroSpend: UnmatchedGoogleAdsCampaign[];
}

// Scope unmatched activity to the current entity before presenting it.
// Group view's predicate accepts every confirmed Google Ads brand.
export function filterUnmatchedGoogleAdsByEntity(
  rows: UnmatchedGoogleAdsCampaign[],
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean
): UnmatchedGoogleAdsCampaign[] {
  return rows.filter((row) => matchesSelectedEntity(row.brand));
}

// Positive spend in the selected Google Ads period is the actionable queue.
// Genuine zero-spend rows remain available as history and are never removed.
export function prioritiseUnmatchedGoogleAds(
  rows: UnmatchedGoogleAdsCampaign[]
): PrioritisedUnmatchedGoogleAds {
  const byPriority = (a: UnmatchedGoogleAdsCampaign, b: UnmatchedGoogleAdsCampaign) =>
    b.spend - a.spend || a.campaignName.localeCompare(b.campaignName);

  return {
    withSpend: rows.filter((row) => row.spend > 0).sort(byPriority),
    zeroSpend: rows.filter((row) => row.spend <= 0).sort(byPriority),
  };
}

export function searchUnmatchedGoogleAds(
  rows: UnmatchedGoogleAdsCampaign[],
  query: string
): UnmatchedGoogleAdsCampaign[] {
  const normalised = query.trim().toLocaleLowerCase('en-GB');
  if (!normalised) return rows;
  return rows.filter((row) => row.campaignName.toLocaleLowerCase('en-GB').includes(normalised));
}
