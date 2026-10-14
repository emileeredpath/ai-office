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
    <div className="v2-page calls-page">
      <div className="max-w-7xl mx-auto calls-page-inner">
        <div className="v2-page-header">
          <div>
            <p className="calls-page-eyebrow">Infinity call tracking</p>
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

        <div className="mb-8">
          <h2 className="v2-section-title">Call performance</h2>
          <p className="text-sm text-text-secondary mb-4">
            Real entity and period scoped Infinity calls. Answered and missed status uses Infinity's confirmed bridge
            data and unavailable data is never converted to zero.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <KpiCard
              title="Answer Rate"
              value={showRealTotals && answerRate !== null ? `${answerRate}%` : undefined}
              status={showRealTotals && answerRate !== null ? 'available' : 'not-connected'}
              subtitle={showRealTotals ? 'Answered ÷ Total Calls' : callPerf.subtitle}
              accent="var(--v2-orange)"
            />
          </div>
        </div>

        <details className="card calls-supporting-section mb-8">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Explore call quality</summary>
          <div className="calls-supporting-content">
            <div className="grid grid-cols-2 gap-4">
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
                subtitle={ppcAssisted.subtitle}
                size="compact"
              />
            </div>
          </div>
        </details>

        <details className="card calls-supporting-section mb-8">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Explore call sources</summary>
          <div className="calls-supporting-content">
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
        </details>

        <details className="card calls-supporting-section mb-8">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Explore landing pages</summary>
          <div className="calls-supporting-content">
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
                          <td className="text-text-primary text-xs" style={{ maxWidth: 320 }} title={row.url}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</div>
                            <div
                              className="text-text-secondary"
                              style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}
                            >
                              {row.url}
                            </div>
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
        </details>

        <div className="card calls-commercial-boundary mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Commercial outcomes are not connected</h2>
          <p className="text-sm text-text-secondary">
            Qualified calls, marketing leads, open pipeline and won revenue require a trustworthy Infinity to CRM
            link. They remain unavailable and are not inferred from call activity.
          </p>
        </div>

        <details className="card calls-supporting-section mb-8">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Understand the attribution journey</summary>
          <div className="calls-supporting-content">
            <CallAttributionJourney />
          </div>
        </details>

        <details className="card calls-supporting-section mb-8">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Explore call performance over time</summary>
          <div className="calls-supporting-content">
            <CallOverTimePanel />
          </div>
        </details>

        <details className="card calls-supporting-section mb-4">
          <summary className="text-sm font-semibold text-text-primary cursor-pointer">Explore call records</summary>
          <div className="calls-supporting-content calls-log-content">
            <CallLogTable calls={calls} infinityConfigured={infinityConfigured} showRealTotals={showRealTotals} />
          </div>
        </details>
      </div>
    </div>
  );
}
