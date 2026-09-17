import { useEffect, useMemo, useState } from 'react';
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
import { fetchGa4WebsiteJourney, type Ga4WebsiteJourneyResponse } from '@/services/ga4Api';
import { getWebsiteJourneyPages, getEntryPageEngagement, type WebsiteJourneyList } from '@/utils/websiteJourney';
import { BRAND_LABEL } from '@/utils/brandColors';
import { getGa4PageUrl, getSearchConsolePageUrl } from '@/utils/websitePageLinks';

function Ga4PageLink({ brand, pagePath }: { brand: WebsiteJourneyList['rows'][number]['brand']; pagePath: string }) {
  const href = getGa4PageUrl(brand, pagePath);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-text-primary underline break-all" title={`Open ${pagePath} on the ${BRAND_LABEL[brand]} website`}>
      {pagePath} <span aria-hidden="true">↗</span>
    </a>
  ) : <span className="text-text-primary break-all">{pagePath}</span>;
}

function SearchConsolePageLink({ page }: { page: string }) {
  const href = getSearchConsolePageUrl(page);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-text-primary underline" title="Open this website page">
      {page} <span aria-hidden="true">↗</span>
    </a>
  ) : <span className="text-text-primary">{page}</span>;
}

function JourneyPageList({ title, description, data, loading, isGroupView, accent }: {
  title: string;
  description: string;
  data: WebsiteJourneyList;
  loading: boolean;
  isGroupView: boolean;
  accent: string;
}) {
  const renderRows = (rows: WebsiteJourneyList['rows'], start: number) => (
    <ol className="space-y-3">
      {rows.map((row, index) => (
        <li key={`${row.brand}:${row.pagePath}`} className="flex items-start gap-3 text-sm">
          <span className="text-text-secondary" style={{ minWidth: 18 }}>{start + index}.</span>
          <span className="min-w-0 flex-1">
            <span className="block" title={row.pagePath}><Ga4PageLink brand={row.brand} pagePath={row.pagePath} /></span>
            {isGroupView && <span className="text-xs text-text-secondary">{BRAND_LABEL[row.brand]}</span>}
          </span>
          <strong className="text-text-primary tabular-nums">{row.count.toLocaleString('en-GB')}</strong>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="card p-5" style={{ borderTop: `4px solid ${accent}` }}>
      <h3 className="font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary mb-4">{description}</p>
      {loading ? <p className="text-sm text-text-secondary">Loading GA4 pages…</p> : data.status !== 'available' ? (
        <p className="text-sm text-text-secondary">{data.subtitle}</p>
      ) : data.rows.length === 0 ? (
        <p className="text-sm text-text-secondary">No matching activity in this period.</p>
      ) : (
        <>
          {renderRows(data.rows.slice(0, 3), 1)}
          {data.rows.length > 3 && (
            <details className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <summary className="text-sm font-medium text-text-primary cursor-pointer">Show {data.rows.length - 3} more pages</summary>
              <div className="mt-3">{renderRows(data.rows.slice(3), 4)}</div>
            </details>
          )}
        </>
      )}
      {data.status === 'available' && <p className="text-xs text-text-secondary mt-4">{data.subtitle}</p>}
    </div>
  );
}

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
  const [journey, setJourney] = useState<Ga4WebsiteJourneyResponse | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(true);
  const [journeyError, setJourneyError] = useState(false);
  const [showAllEngagement, setShowAllEngagement] = useState(false);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();
  useEffect(() => { setShowAllEngagement(false); }, [period, selectedEntity]);

  const scRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  useEffect(() => {
    syncSearchConsolePerformance(scRange.startDate, scRange.endDate);
  }, [scRange.startDate, scRange.endDate, syncSearchConsolePerformance]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  useEffect(() => {
    let active = true;
    setJourney(null);
    setJourneyLoading(true);
    setJourneyError(false);
    fetchGa4WebsiteJourney(ga4Range.startDate, ga4Range.endDate)
      .then((data) => { if (active) setJourney(data); })
      .catch(() => { if (active) setJourneyError(true); })
      .finally(() => { if (active) setJourneyLoading(false); });
    return () => { active = false; };
  }, [ga4Range.startDate, ga4Range.endDate]);

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
  const entryPages = useMemo(() => getWebsiteJourneyPages(journey, isGroupView, selectedEntity, 'entryPages'), [journey, isGroupView, selectedEntity]);
  const viewedPages = useMemo(() => getWebsiteJourneyPages(journey, isGroupView, selectedEntity, 'topPages'), [journey, isGroupView, selectedEntity]);
  const enquiryPages = useMemo(() => getWebsiteJourneyPages(journey, isGroupView, selectedEntity, 'enquiryPages'), [journey, isGroupView, selectedEntity]);
  const entryEngagement = useMemo(() => getEntryPageEngagement(journey, isGroupView, selectedEntity), [journey, isGroupView, selectedEntity]);

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
              {isGroupView ? 'Website pages and organic search across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        <div className="mb-8">
          <h2 className="v2-section-title">Where people go</h2>
          <p className="text-sm text-text-secondary mb-4" style={{ marginTop: -8 }}>
            GA4 shows where sessions start, which pages are viewed and where verified enquiry actions occur. These are separate totals, not a linked path or drop-off rate.
          </p>
          {journeyError && <p className="text-sm text-text-secondary mb-3">GA4 page reporting could not load. Please try again.</p>}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <JourneyPageList title="Entry pages" description="First page of a GA4 session · sessions" data={entryPages} loading={journeyLoading} isGroupView={isGroupView} accent="var(--v2-blue)" />
            <JourneyPageList title="Most viewed pages" description="Pages people looked at · page views" data={viewedPages} loading={journeyLoading} isGroupView={isGroupView} accent="var(--v2-purple)" />
            <JourneyPageList title="Enquiry pages" description="Page where a verified form, phone, email or live chat event fired · events" data={enquiryPages} loading={journeyLoading} isGroupView={isGroupView} accent="var(--v2-green)" />
          </div>
          <p className="text-xs text-text-secondary mt-3">
            Page links omit query strings. Enquiry events can occur on any page and are not CRM leads. Enquiry pages require confirmed event definitions.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="v2-section-title">Where engagement weakens</h2>
          <p className="text-sm text-text-secondary mb-4" style={{ marginTop: -8 }}>
            GA4 bounce rate highlights busy entry pages to review. It does not prove someone left that page or failed to enquire.
          </p>
          <details className="text-xs text-text-secondary mb-3">
            <summary className="cursor-pointer">What counts as a bounce?</summary>
            <p className="mt-2">A session is counted as bounced when it lasts no longer than 10 seconds, has no key event and includes fewer than two page views.</p>
          </details>
          <div className="card p-0" style={{ overflowX: 'auto' }}>
            {journeyLoading ? <p className="p-5 text-sm text-text-secondary">Loading GA4 engagement…</p>
              : entryEngagement.status !== 'available' ? <p className="p-5 text-sm text-text-secondary">{entryEngagement.subtitle}</p>
              : entryEngagement.rows.length === 0 ? <p className="p-5 text-sm text-text-secondary">No entry page activity in this period.</p>
              : <table className="table w-full text-sm" style={{ minWidth: 600 }}>
                <thead><tr><th>Entry page</th><th style={{ textAlign: 'right' }}>Sessions</th><th style={{ textAlign: 'right' }}>Engaged sessions</th><th style={{ textAlign: 'right' }}>Bounce rate</th></tr></thead>
                <tbody>{entryEngagement.rows.slice(0, showAllEngagement ? undefined : 3).map((row) => (
                  <tr key={`${row.brand}:${row.pagePath}`}>
                    <td><Ga4PageLink brand={row.brand} pagePath={row.pagePath} />{isGroupView && <span className="block text-xs text-text-secondary">{BRAND_LABEL[row.brand]}</span>}</td>
                    <td style={{ textAlign: 'right' }}>{row.sessions.toLocaleString('en-GB')}</td>
                    <td style={{ textAlign: 'right' }}>{row.engagedSessions.toLocaleString('en-GB')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--v2-orange)' }}>{(row.bounceRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}</tbody>
              </table>}
            {entryEngagement.status === 'available' && entryEngagement.rows.length > 3 && (
              <button type="button" className="w-full text-left text-sm font-medium p-4" style={{ color: 'var(--v2-purple)' }} onClick={() => setShowAllEngagement((show) => !show)}>
                {showAllEngagement ? 'Show fewer entry pages' : `Show all ${entryEngagement.rows.length} entry pages`}
              </button>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-3">Sorted by entry sessions, so a high rate on a very small page is not presented as the biggest issue. {entryEngagement.status === 'available' ? entryEngagement.subtitle : ''}</p>
        </div>

        {/* Organic Search — Search Console */}
        <div className="mb-8">
          <h2 className="v2-section-title">Organic Search Performance</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Google Search Console clicks do not imply GA4 enquiries. Recent search data can lag by 2–3 days; try a longer reporting period if activity looks sparse.
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

        <details className="mb-8">
          <summary className="card text-sm font-medium text-text-primary cursor-pointer">Explore search terms and landing pages</summary>
        {/* Top Search Queries */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Search Queries</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real, literal search terms from Google Search Console. Automatic detection of queries that might contain
            personal information isn't reliable enough to filter without risking hidden or misleading SEO data — treat
            this table as a reporting view, not one to export or share outside the team.
          </p>
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
                            <SearchConsolePageLink page={row.page} />
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
            ranking for a different page than it currently is. As with Top Search Queries above, these are shown as
            entered — treat as a reporting view, not one to export or share outside the team.
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
                            <SearchConsolePageLink page={row.page} />
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

        </details>

        {/* GA4 Enquiries — deliberately separate source */}
        <div className="mb-8">
          <h2 className="v2-section-title">GA4 Enquiries</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Verified website actions from GA4, separate from Search Console clicks and not confirmed CRM leads.
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
          <details className="card mb-4">
            <summary className="text-sm font-medium text-text-primary cursor-pointer">Search Console coverage by entity</summary>
            <p className="text-xs text-text-secondary mt-3 mb-3">
              MTech Group above combines only the entities marked Connected below. IDARO has a real Search Console
              property but is switched to individually in the entity selector — it is not included in any MTech Group total.
            </p>
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
          </details>
        )}
      </div>
    </div>
  );
}
