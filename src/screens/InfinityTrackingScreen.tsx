import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { CallAttributionJourney } from '@/components/calls/CallAttributionJourney';
import { CallOverTimePanel } from '@/components/calls/CallOverTimePanel';
import { CallLogTable } from '@/components/calls/CallLogTable';

const ENTITY_NOT_MAPPED_SUBTITLE = 'Entity-level call attribution not available yet';

// Call Tracking — a commercial attribution page for marketing-generated
// calls, not just a call log. Preserves the real Infinity data path
// (syncWave1Calls / wave1Performance.infinity) exactly as-is; nothing
// here is mocked. Two honest limits shape every figure: Infinity isn't
// configured in this environment (so Total/Answered/Missed/Answer
// Rate/Avg Duration show "Not connected" here), and even when Infinity
// is configured, its data carries no genuine entity attribution today —
// the persisted history's hardcoded brand:'mtech' is a technical
// limitation, not evidence calls belong to MTech Group, so entity-scoped
// views show an explanatory "not available" state rather than the
// combined figure. Qualification and CRM linkage (Qualified Calls,
// Marketing Leads, Open Pipeline, Won Revenue) don't exist anywhere in
// the app yet and stay "Not connected" regardless of entity or period.
export function InfinityTrackingScreen() {
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const { isGroupView, selectedEntity } = useEntity();

  useEffect(() => {
    syncWave1Calls();
  }, [syncWave1Calls]);

  const infinityConfigured = wave1Performance?.infinityConfigured === true;
  const infinityHasErrors = (wave1Performance?.infinityErrors?.length ?? 0) > 0;
  const infinity = wave1Performance?.infinity ?? null;
  const calls = infinity?.calls ?? [];

  // Real numbers are only ever shown at MTech Group level, where "combined,
  // unattributed" is an honest description of what this data actually is.
  // At a specific entity, there is no genuine way to say these calls
  // belong to that entity, so the figure is withheld rather than reused.
  const showRealTotals = infinityConfigured && isGroupView;

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const freshnessEntries: FreshnessEntry[] = [
    infinityConfigured
      ? { label: 'Infinity', status: infinityHasErrors ? 'error' : 'live', detail: infinityHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'Infinity', status: 'not-connected', detail: 'Not connected' },
    { label: 'Acumatica CRM', status: 'not-connected', detail: 'Not connected' },
  ];

  const answerRate = infinity && infinity.totalCalls > 0 ? Math.round((infinity.answeredCalls / infinity.totalCalls) * 100) : null;

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Call Tracking</h1>
            <p className="text-text-secondary">
              {isGroupView
                ? 'Marketing-generated calls and commercial outcomes across MTech Group'
                : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total Calls"
            value={showRealTotals ? infinity!.totalCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={showRealTotals ? 'Combined Infinity call activity — not yet entity-mapped' : isGroupView ? 'Awaiting Infinity integration' : ENTITY_NOT_MAPPED_SUBTITLE}
            accent="var(--v2-purple)"
          />
          <KpiCard
            title="Answered"
            value={showRealTotals ? infinity!.answeredCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={showRealTotals ? 'Combined Infinity call activity — not yet entity-mapped' : isGroupView ? 'Awaiting Infinity integration' : ENTITY_NOT_MAPPED_SUBTITLE}
            accent="var(--v2-green)"
          />
          <KpiCard
            title="Missed"
            value={showRealTotals ? infinity!.missedCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={showRealTotals ? 'Combined Infinity call activity — not yet entity-mapped' : isGroupView ? 'Awaiting Infinity integration' : ENTITY_NOT_MAPPED_SUBTITLE}
            accent="var(--v2-red)"
          />
          <KpiCard title="Qualified Calls" status="not-connected" subtitle="Qualification data not available" />
          <KpiCard title="Marketing Leads" status="not-connected" subtitle="Requires Infinity + CRM attribution" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
        </div>

        {/* Call Quality */}
        <div className="mb-8">
          <h2 className="v2-section-title">Call Quality</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Answer Rate"
              value={showRealTotals && answerRate !== null ? `${answerRate}%` : undefined}
              status={showRealTotals && answerRate !== null ? 'available' : 'not-connected'}
              subtitle={showRealTotals ? 'Answered ÷ Total Calls' : isGroupView ? 'Awaiting Infinity integration' : ENTITY_NOT_MAPPED_SUBTITLE}
              size="compact"
            />
            <KpiCard
              title="Average Call Duration"
              value={showRealTotals ? infinity!.avgDuration : undefined}
              status={showRealTotals ? 'available' : 'not-connected'}
              subtitle={showRealTotals ? 'Across all connected calls' : isGroupView ? 'Awaiting Infinity integration' : ENTITY_NOT_MAPPED_SUBTITLE}
              size="compact"
            />
          </div>
        </div>

        {/* Attribution journey */}
        <div className="mb-8">
          <h2 className="v2-section-title">Attribution Journey</h2>
          <div className="card">
            <CallAttributionJourney />
          </div>
        </div>

        {/* Call Performance Over Time */}
        <div className="mb-8">
          <h2 className="v2-section-title">Call Performance Over Time</h2>
          <div className="card">
            <CallOverTimePanel />
          </div>
        </div>

        {/* Call Log */}
        <div className="mb-4">
          <h2 className="v2-section-title">Call Log</h2>
          <div className="card" style={{ padding: 0 }}>
            <CallLogTable calls={calls} infinityConfigured={infinityConfigured} isGroupView={isGroupView} />
          </div>
        </div>
      </div>
    </div>
  );
}
