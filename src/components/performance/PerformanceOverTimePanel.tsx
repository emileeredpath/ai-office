import { TrendingUp } from 'lucide-react';

// No genuine historical time-series exists yet — the one real per-day
// metrics table (wave_1_performance_metrics) is only ever written to when
// GA4 sync actually runs, and GA4 isn't configured in this environment, so
// it's empty. Rather than chart current campaign totals as if they were a
// trend (which they aren't — they're a snapshot), this shows an honest
// unavailable state, laid out so a real chart can drop in once genuine
// historical data exists.
export function PerformanceOverTimePanel() {
  return (
    <div className="v2-over-time-empty">
      <TrendingUp size={28} color="var(--v2-grey)" />
      <p className="v2-over-time-empty-title">No historical trend data yet</p>
      <p className="v2-over-time-empty-subtitle">
        Performance Over Time will show real trends once GA4 and/or Acumatica history is connected and synced. Current
        totals are a snapshot, not a series — nothing is plotted from them here.
      </p>
    </div>
  );
}
