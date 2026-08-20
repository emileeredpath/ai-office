import { TrendingUp } from 'lucide-react';

// No genuine historical call-volume series has accumulated yet — Infinity
// isn't configured in this environment, and even once it is, history only
// builds up from real scheduled syncs going forward. Same honest
// empty-state pattern as Performance/PPC's over-time panels. Nothing is
// charted from current totals.
export function CallOverTimePanel() {
  return (
    <div className="v2-over-time-empty">
      <TrendingUp size={28} color="var(--v2-grey)" />
      <p className="v2-over-time-empty-title">No historical call trend data yet</p>
      <p className="v2-over-time-empty-subtitle">
        Once Infinity is connected and real call history has accumulated, this will chart trends in Total Calls,
        Answered, Missed, Answer Rate and Average Duration — and Qualified Calls / Marketing Leads once that
        attribution exists. Nothing is plotted here today.
      </p>
    </div>
  );
}
