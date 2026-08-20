import { TrendingUp } from 'lucide-react';

// No genuine PPC time-series data exists yet — there is no Google Ads
// integration and no dedicated PPC metrics table today. Same honest empty
// state pattern as Performance's Performance Over Time panel, with PPC's
// own explanation of what it will eventually plot. Nothing is charted
// from current totals — there are no current totals to chart from either.
export function PpcOverTimePanel() {
  return (
    <div className="v2-over-time-empty">
      <TrendingUp size={28} color="var(--v2-grey)" />
      <p className="v2-over-time-empty-title">No historical PPC trend data yet</p>
      <p className="v2-over-time-empty-subtitle">
        Once Google Ads is connected, this will chart trends in Spend, Clicks, Conversions, Marketing Leads and Cost
        per Lead — and Pipeline / Won Revenue once CRM attribution from Acumatica supports it. Nothing is plotted
        here today.
      </p>
    </div>
  );
}
