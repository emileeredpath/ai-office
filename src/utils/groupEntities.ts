import type { Brand } from '@/types/index';

// The four entities with a real, individually-attributable data source
// (their own GA4 property, their own Campaign Monitor naming convention)
// that "MTech Group" aggregates across — deliberately just the brands the
// V2 entity selector actually exposes. `mtech` (the unmatched/fallback
// bucket) and `idaro` are out of scope for any V2 group-level total, even
// where the backend has data for them — this is a shared, deliberate
// scoping decision, not a per-integration one, so GA4 and Campaign Monitor
// can never define "MTech Group" differently from each other.
export const GROUP_AGGREGATE_BRANDS: Brand[] = ['brentwood', 'radio-links', 'capcom', 'ircl'];
