export interface FunnelStage {
  label: string;
  value: number | null; // null = not connected
  subtitle?: string;
}

// Website Visits -> Enquiries -> Marketing Leads -> Opportunities -> Won
// Deals. Stages with value === null render as "Not connected" rather than
// 0 or an invented number — most of this funnel has no data source yet
// (see Overview's NOT_CONNECTED note).
export function MarketingFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value ?? 0));

  return (
    <div className="v2-funnel">
      {stages.map((stage) => {
        const isConnected = stage.value !== null;
        const widthPct = isConnected ? Math.max(4, Math.round(((stage.value as number) / max) * 100)) : 0;
        return (
          <div key={stage.label} className="v2-funnel-row">
            <div className="v2-funnel-label">{stage.label}</div>
            <div className="v2-funnel-track">
              {isConnected ? (
                <div className="v2-funnel-bar" style={{ width: `${widthPct}%` }} />
              ) : (
                <div className="v2-funnel-bar v2-funnel-bar-empty" />
              )}
            </div>
            <div className="v2-funnel-value">
              {isConnected ? stage.value!.toLocaleString() : <span className="v2-funnel-not-connected">Not connected</span>}
            </div>
            {stage.subtitle && <div className="v2-funnel-subtitle">{stage.subtitle}</div>}
          </div>
        );
      })}
    </div>
  );
}
