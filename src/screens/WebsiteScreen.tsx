import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import {
  resolveSearchConsoleDateRange,
  getSearchConsoleSummary,
  getSearchConsoleTopQueries,
  getSearchConsoleTopPages,
  getSearchConsoleTopQueryPageCombinations,
  getSearchConsoleCoverage,
} from '@/utils/searchConsole';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';

// Website — Phase 1. Real Google Search Console organic search
// performance (clicks, impressions, CTR, average position, top queries,
// top landing pages) for the entities with a verified Search Console
// property, read through the shared aggregation layer in
// src/utils/searchConsole.ts. GA4 Enquiries appears below as a clearly
// separate section with its own source label — Search Console traffic
// and GA4 Enquiries are never merged into one figure, and a Search
// Console click is never presented as having caused an enquiry. Capcom,
// Brentwood and Radio Links have both a real Search Console property and
// a verified GA4 Enquiry definition; IDARO has a real Search Console
// property but no verified GA4 Enquiry definition yet (shown honestly as
// "Not defined"); Irish Radio has a verified GA4 Enquiry definition but
// no Search Console property yet (shown honestly as "Not connected").
export function WebsiteScreen() {
  const searchConsolePerformance = useAppStore((s) => s.searchConsolePerformance);
  const syncSearchConsolePerformance = useAppStore((s) => s.syncSearchConsolePerformance);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();

  const scRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  useEffect(() => {
    syncSearchConsolePerformance(scRange.startDate, scRange.endDate);
  }, [scRange.startDate, scRange.endDate, syncSearchConsolePerformance]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  const summary = useMemo(
    () => getSearchConsoleSummary(searchConsolePerformance, isGroupView, selectedEntity),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );
  const topQueries = useMemo(
    () => getSearchConsoleTopQueries(searchConsolePerformance, isGroupView, selectedEntity, 25),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );
  const topPages = useMemo(
    () => getSearchConsoleTopPages(searchConsolePerformance, isGroupView, selectedEntity, 25),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );
  const topQueryPages = useMemo(
    () => getSearchConsoleTopQueryPageCombinations(searchConsolePerformance, isGroupView, selectedEntity, 20),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );
  const coverage = useMemo(() => getSearchConsoleCoverage(searchConsolePerformance), [searchConsolePerformance]);
  const enquiries = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const scConfigured = searchConsolePerformance?.configured === true;
  const scHasErrors = (searchConsolePerformance?.errors?.length ?? 0) > 0;
  const ga4Configured = ga4Enquiries?.configured === true;
  const ga4HasErrors = (ga4Enquiries?.errors?.length ?? 0) > 0;

  const freshnessEntries: FreshnessEntry[] = [
    scConfigured
      ? { label: 'Search Console', status: scHasErrors ? 'error' : 'live', detail: scHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'Search Console', status: 'not-connected', detail: 'Not connected' },
    ga4Configured
      ? { label: 'GA4 Enquiries', status: ga4HasErrors ? 'error' : 'live', detail: ga4HasErrors ? 'Sync error' : 'Connected' }
      : { label: 'GA4 Enquiries', status: 'not-connected', detail: 'Not connected' },
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Website</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Real organic search performance across connected MTech Group entities' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Organic Search — Search Console */}
        <div className="mb-8">
          <h2 className="v2-section-title">Organic Search Performance</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real Google Search Console data — searches that brought people to the website. A separate measurement
            from GA4 Enquiries below; a Search Console click never implies an enquiry happened. Search Console
            typically takes 2–3 days to index and report a given day's data, so very recent dates (including "This
            month" in the first few days of a new month) can genuinely show little or nothing yet — that's a real
            reporting lag, not a broken connection. Try "This quarter" or "This year" to see recent activity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Search Clicks"
              value={summary.status === 'available' ? summary.clicks!.toLocaleString('en-GB') : undefined}
              status={summary.status}
              subtitle={summary.subtitle}
            />
            <KpiCard
              title="Search Impressions"
              value={summary.status === 'available' ? summary.impressions!.toLocaleString('en-GB') : undefined}
              status={summary.status}
              subtitle={summary.subtitle}
            />
            <KpiCard
              title="CTR"
              value={summary.status === 'available' && summary.ctr != null ? `${summary.ctr}%` : undefined}
              status={summary.status === 'available' && summary.ctr != null ? 'available' : 'not-connected'}
              subtitle={summary.status === 'available' ? 'Clicks ÷ Impressions' : summary.subtitle}
            />
            <KpiCard
              title="Average Position"
              value={summary.status === 'available' && summary.position != null ? summary.position : undefined}
              status={summary.status === 'available' && summary.position != null ? 'available' : 'not-connected'}
              subtitle={summary.status === 'available' ? 'Impression-weighted average ranking position' : summary.subtitle}
            />
          </div>
        </div>

        {/* Top Search Queries */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Search Queries</h2>
          {topQueries.status === 'available' ? (
            topQueries.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th style={{ textAlign: 'right' }}>Clicks</th>
                        <th style={{ textAlign: 'right' }}>Impressions</th>
                        <th style={{ textAlign: 'right' }}>CTR</th>
                        <th style={{ textAlign: 'right' }}>Avg. Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueries.rows.map((row) => (
                        <tr key={row.query}>
                          <td className="text-text-primary">{row.query}</td>
                          <td style={{ textAlign: 'right' }}>{row.clicks.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.impressions.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.ctr != null ? `${row.ctr}%` : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{row.position ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No search queries in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{topQueries.subtitle}</p>
            </div>
          )}
        </div>

        {/* Top Landing Pages */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Landing Pages</h2>
          {topPages.status === 'available' ? (
            topPages.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th>Landing Page</th>
                        <th style={{ textAlign: 'right' }}>Clicks</th>
                        <th style={{ textAlign: 'right' }}>Impressions</th>
                        <th style={{ textAlign: 'right' }}>CTR</th>
                        <th style={{ textAlign: 'right' }}>Avg. Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.rows.map((row) => (
                        <tr key={row.page}>
                          <td
                            className="text-text-primary text-xs"
                            style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={row.page}
                          >
                            {row.page}
                          </td>
                          <td style={{ textAlign: 'right' }}>{row.clicks.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.impressions.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.ctr != null ? `${row.ctr}%` : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{row.position ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No landing pages with organic clicks in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{topPages.subtitle}</p>
            </div>
          )}
        </div>

        {/* Query + Landing Page detail */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Query + Landing Page Combinations</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Which real search terms brought people to which real page — useful for spotting a query that should be
            ranking for a different page than it currently is.
          </p>
          {topQueryPages.status === 'available' ? (
            topQueryPages.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th>Landing Page</th>
                        <th style={{ textAlign: 'right' }}>Clicks</th>
                        <th style={{ textAlign: 'right' }}>Impressions</th>
                        <th style={{ textAlign: 'right' }}>Avg. Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueryPages.rows.map((row) => (
                        <tr key={`${row.query}__${row.page}`}>
                          <td className="text-text-primary">{row.query}</td>
                          <td
                            className="text-text-secondary text-xs"
                            style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={row.page}
                          >
                            {row.page}
                          </td>
                          <td style={{ textAlign: 'right' }}>{row.clicks.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.impressions.toLocaleString('en-GB')}</td>
                          <td style={{ textAlign: 'right' }}>{row.position ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No query/page combinations in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{topQueryPages.subtitle}</p>
            </div>
          )}
        </div>

        {/* GA4 Enquiries — deliberately separate source */}
        <div className="mb-8">
          <h2 className="v2-section-title">GA4 Enquiries</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            A different, independently-verified source from Search Console above — genuine website actions (form,
            phone, email, live chat), not derived from or implying any Search Console click.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="GA4 Enquiries"
              value={enquiries.status === 'available' ? enquiries.total : undefined}
              status={enquiries.status}
              subtitle={enquiries.subtitle}
              accent="var(--v2-green)"
            />
            <KpiCard title="Form" value={enquiries.form.status === 'available' ? enquiries.form.value : undefined} status={enquiries.form.status} subtitle={enquiries.form.subtitle} size="compact" />
            <KpiCard title="Phone" value={enquiries.phone.status === 'available' ? enquiries.phone.value : undefined} status={enquiries.phone.status} subtitle={enquiries.phone.subtitle} size="compact" />
            <KpiCard title="Email" value={enquiries.email.status === 'available' ? enquiries.email.value : undefined} status={enquiries.email.status} subtitle={enquiries.email.subtitle} size="compact" />
          </div>
        </div>

        {/* Search Console coverage disclosure */}
        {isGroupView && (
          <div className="mb-4">
            <h2 className="v2-section-title">Search Console Coverage</h2>
            <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
              MTech Group above combines only the entities marked Connected below. IDARO has a real Search Console
              property but is switched to individually in the entity selector — it is not included in any MTech Group total.
            </p>
            <div className="card p-0">
              <div style={{ overflowX: 'auto' }}>
                <table className="table w-full text-sm" style={{ minWidth: 320 }}>
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Search Console</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((entry) => (
                      <tr key={entry.brand}>
                        <td className="text-text-primary">{entry.label}</td>
                        <td>
                          {entry.connected ? (
                            <span style={{ color: 'var(--v2-green)', fontWeight: 600 }}>Connected</span>
                          ) : (
                            <span className="text-text-secondary">Not connected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
