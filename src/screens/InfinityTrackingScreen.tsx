import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { CallAttributionJourney } from '@/components/calls/CallAttributionJourney';
import { CallOverTimePanel } from '@/components/calls/CallOverTimePanel';
import { CallLogTable } from '@/components/calls/CallLogTable';
import {
  resolveCallDateRange,
  getCallPerformance,
  getCallSourceBreakdown,
  getTopLandingPages,
  getPpcAssistedCalls,
} from '@/utils/callPerformance';

// Call Tracking — a commercial attribution page for marketing-generated
// calls, not just a call log. Uses the real, entity-attributed Infinity
// call source (syncInfinityCalls / src/utils/callPerformance.ts) — each
// call's entity comes from its real dgrpName, confirmed against the live
// account for Brentwood, Radio Links, and Irish Radio only. Any other
// entity (Capcom included, until its real dgrpName is confirmed) shows an
// honest "not confirmed yet" state rather than a guess. Qualification and
// CRM linkage (Qualified Calls, Marketing Leads, Open Pipeline, Won
// Revenue) don't exist anywhere in the app yet and stay "Not connected"
// regardless of entity or period.
export function InfinityTrackingScreen() {
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();

  const callRange = useMemo(() => resolveCallDateRange(period), [period]);
  useEffect(() => {
    syncInfinityCalls(callRange.startDate, callRange.endDate);
  }, [callRange.startDate, callRange.endDate, syncInfinityCalls]);

  const infinityConfigured = infinityCalls?.configured === true;
  const infinityHasErrors = (infinityCalls?.errors?.length ?? 0) > 0;

  const callPerf = useMemo(
    () => getCallPerformance(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const showRealTotals = callPerf.status === 'available';
  const calls = callPerf.calls ?? [];

  const sourceBreakdown = useMemo(
    () => getCallSourceBreakdown(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const topLandingPages = useMemo(
    () => getTopLandingPages(infinityCalls, isGroupView, selectedEntity, 10),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const ppcAssisted = useMemo(
    () => getPpcAssistedCalls(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const freshnessEntries: FreshnessEntry[] = [
    infinityConfigured
      ? { label: 'Infinity', status: infinityHasErrors ? 'error' : 'live', detail: infinityHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'Infinity', status: 'not-connected', detail: 'Not connected' },
    { label: 'Acumatica CRM', status: 'not-connected', detail: 'Not connected' },
  ];

  const answerRate =
    showRealTotals && callPerf.totalCalls! > 0 ? Math.round((callPerf.answeredCalls! / callPerf.totalCalls!) * 100) : null;

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
            value={showRealTotals ? callPerf.totalCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={callPerf.subtitle}
            accent="var(--v2-purple)"
          />
          <KpiCard
            title="Answered"
            value={showRealTotals ? callPerf.answeredCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={callPerf.subtitle}
            accent="var(--v2-green)"
          />
          <KpiCard
            title="Missed"
            value={showRealTotals ? callPerf.missedCalls : undefined}
            status={showRealTotals ? 'available' : 'not-connected'}
            subtitle={callPerf.subtitle}
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
              subtitle={showRealTotals ? 'Answered ÷ Total Calls' : callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="Average Call Duration"
              value={showRealTotals ? callPerf.avgDuration : undefined}
              status={showRealTotals ? 'available' : 'not-connected'}
              subtitle={showRealTotals ? 'Across all connected calls' : callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="PPC-Assisted Calls"
              value={ppcAssisted.status === 'available' ? ppcAssisted.count : undefined}
              status={ppcAssisted.status}
              subtitle={ppcAssisted.status === 'available' ? ppcAssisted.subtitle : ppcAssisted.subtitle}
              size="compact"
            />
          </div>
        </div>

        {/* Call Source Breakdown */}
        <div className="mb-8">
          <h2 className="v2-section-title">Call Source Breakdown</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Based on Infinity's own chType field. Calls with no recognised source are shown as Unclassified — never
            assumed Direct.
          </p>
          {sourceBreakdown.status === 'available' ? (
            sourceBreakdown.buckets.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Calls</th>
                        <th style={{ textAlign: 'right' }}>Answered</th>
                        <th style={{ textAlign: 'right' }}>Missed</th>
                        <th style={{ textAlign: 'right' }}>Answer Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceBreakdown.buckets.map((bucket) => (
                        <tr key={bucket.source}>
                          <td className="text-text-primary">{bucket.source}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.calls}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.answered}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.missed}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.answerRate != null ? `${bucket.answerRate}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No calls in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{sourceBreakdown.subtitle}</p>
            </div>
          )}
        </div>

        {/* Top Landing Pages */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Landing Pages</h2>
          {topLandingPages.status === 'available' ? (
            topLandingPages.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th>Landing Page</th>
                        <th style={{ textAlign: 'right' }}>Calls</th>
                        <th style={{ textAlign: 'right' }}>Answered</th>
                        <th style={{ textAlign: 'right' }}>Missed</th>
                        <th style={{ textAlign: 'right' }}>Answer Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLandingPages.rows.map((row) => (
                        <tr key={row.url}>
                          <td className="text-text-primary text-xs" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.url}>
                            {row.label}
                          </td>
                          <td style={{ textAlign: 'right' }}>{row.calls}</td>
                          <td style={{ textAlign: 'right' }}>{row.answered}</td>
                          <td style={{ textAlign: 'right' }}>{row.missed}</td>
                          <td style={{ textAlign: 'right' }}>{row.answerRate != null ? `${row.answerRate}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No calls with a recorded landing page in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{topLandingPages.subtitle}</p>
            </div>
          )}
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
            <CallLogTable calls={calls} infinityConfigured={infinityConfigured} showRealTotals={showRealTotals} />
          </div>
        </div>
      </div>
    </div>
  );
}
