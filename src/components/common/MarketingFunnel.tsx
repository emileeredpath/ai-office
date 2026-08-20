export interface FunnelStage {
  label: string;
  value: number | null; // null = not connected
  subtitle?: string;
}

// Website Visits -> Enquiries -> Marketing Leads -> Opportunities -> Won
// Deals. The shapes stack with zero gap and share one continuous purple
// gradient so they read as a single narrowing funnel rather than separate
// blocks; labels/values sit in a legend below so text is never clipped by
// a shape's taper. Not-connected stages render as a neutral hatched
// segment within that same continuous silhouette. No fabricated widths —
// only real values (or a fixed placeholder width for "not connected")
// ever set a segment's proportion.
export function MarketingFunnel({ stages }: { stages: FunnelStage[] }) {
  const connectedValues = stages.map((s) => s.value).filter((v): v is number => v !== null);
  const maxValue = Math.max(1, ...connectedValues);

  const widths = stages.map((s) => {
    if (s.value === null) return 60; // not-connected placeholder — never proportional to anything
    if (s.value === 0) return 6; // a real zero — a thin sliver, not the same visual weight as a real value
    return Math.max(30, Math.round((s.value / maxValue) * 100));
  });

  return (
    <div className="v2-funnel2">
      <div className="v2-funnel2-shapes">
        {stages.map((stage, i) => {
          const topWidth = widths[i];
          const bottomWidth = i < widths.length - 1 ? widths[i + 1] : Math.max(20, topWidth - 10);
          const leftTop = (100 - topWidth) / 2;
          const rightTop = 100 - leftTop;
          const leftBottom = (100 - bottomWidth) / 2;
          const rightBottom = 100 - leftBottom;
          const isConnected = stage.value !== null;

          return (
            <div
              key={stage.label}
              className="v2-funnel2-shape"
              data-connected={isConnected}
              style={{ clipPath: `polygon(${leftTop}% 0%, ${rightTop}% 0%, ${rightBottom}% 100%, ${leftBottom}% 100%)` }}
            />
          );
        })}
      </div>

      <div className="v2-funnel2-legend">
        {stages.map((stage) => {
          const isConnected = stage.value !== null;
          return (
            <div key={stage.label} className="v2-funnel2-legend-row">
              <span className="v2-funnel2-legend-dot" data-connected={isConnected} />
              <span className="v2-funnel2-label">{stage.label}</span>
              <span className="v2-funnel2-value" data-connected={isConnected}>
                {isConnected ? stage.value!.toLocaleString() : 'Not connected'}
              </span>
              {stage.subtitle && <span className="v2-funnel2-subtitle">{stage.subtitle}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
