import type { Brand } from '@/types/index';

// The four entities with a real, individually-attributable data source
// (their own GA4 property, their own Campaign Monitor naming convention)
// that "MTech Group" aggregates across. `mtech` (the unmatched/fallback
// bucket) and `idaro` are out of scope for any V2 group-level total, even
// where the backend has data for them — this is a shared, deliberate
// scoping decision, not a per-integration one, so GA4, Campaign Monitor
// and Search Console can never define "MTech Group" differently from each
// other. Note this is no longer exactly "the brands the entity selector
// exposes" — `idaro` is individually selectable (it has a real Search
// Console property) but still excluded here.
export const GROUP_AGGREGATE_BRANDS: Brand[] = ['brentwood', 'radio-links', 'capcom', 'ircl'];
