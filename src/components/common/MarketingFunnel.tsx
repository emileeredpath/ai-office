export interface FunnelStage {
  label: string;
  value: number | null; // null = not connected
  subtitle?: string;
}

// Website Visits -> Enquiries -> Marketing Leads -> Opportunities -> Won
// Deals. Renders as a progressively narrowing set of trapezoid bars (the
// "marketing-to-revenue journey" treatment from the mockup) rather than a
// row of stat boxes. Stages with value === null render as a neutral
// hatched bar labelled "Not connected" — never a fabricated width/number.
// Label/value sit in a normal (unclipped) row above each bar so text is
// always fully legible regardless of how narrow a stage's bar gets.
export function MarketingFunnel({ stages }: { stages: FunnelStage[] }) {
  const connectedValues = stages.map((s) => s.value).filter((v): v is number => v !== null);
  const maxValue = Math.max(1, ...connectedValues);

  // Width of each stage's bar as a % of the funnel's own footprint — purely
  // visual proportion of real values, never an invented number. Not-
  // connected stages get a fixed placeholder width (never implied to be
  // proportional to anything).
  const widths = stages.map((s) => {
    if (s.value === null) return 60; // not-connected placeholder — never proportional to anything
    if (s.value === 0) return 6; // a real zero — a thin sliver, not the same visual weight as a real value
    return Math.max(30, Math.round((s.value / maxValue) * 100));
  });

  return (
    <div className="v2-funnel2">
      {stages.map((stage, i) => {
        const topWidth = widths[i];
        const bottomWidth = i < widths.length - 1 ? widths[i + 1] : Math.max(30, topWidth - 10);
        const leftTop = (100 - topWidth) / 2;
        const rightTop = 100 - leftTop;
        const leftBottom = (100 - bottomWidth) / 2;
        const rightBottom = 100 - leftBottom;
        const isConnected = stage.value !== null;
        const shade = 1 - i * 0.14;

        return (
          <div key={stage.label} className="v2-funnel2-row">
            <div className="v2-funnel2-header">
              <span className="v2-funnel2-label">{stage.label}</span>
              <span className="v2-funnel2-value" data-connected={isConnected}>
                {isConnected ? stage.value!.toLocaleString() : 'Not connected'}
              </span>
            </div>
            <div
              className="v2-funnel2-shape"
              data-connected={isConnected}
              style={{
                clipPath: `polygon(${leftTop}% 0%, ${rightTop}% 0%, ${rightBottom}% 100%, ${leftBottom}% 100%)`,
                backgroundColor: isConnected ? `rgba(124, 92, 252, ${Math.max(0.32, shade)})` : undefined,
              }}
            />
            {stage.subtitle && <div className="v2-funnel2-subtitle">{stage.subtitle}</div>}
          </div>
        );
      })}
    </div>
  );
}
