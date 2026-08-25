import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { resolveGa4DateRange, getSocialTraffic, getSocialNetworkBreakdown, getSocialTopLandingPages } from '@/utils/ga4Traffic';
import { getSocialEnquiries, getSocialEnquiriesBySource } from '@/utils/ga4Enquiries';

// Social — Phase 1. Every real figure here is genuine GA4 website traffic
// attributed to Organic/Paid Social (see src/utils/ga4Traffic.ts), read
// through the exact same shared aggregation layer Reports' compact Social
// summary uses, so the two pages can never disagree. This page only ever
// reports what happened once a session reached the website — impressions,
// reach, engagement, followers, follower growth, and posts published are
// platform-side metrics GA4 has no visibility into at all, and are never
// invented here. The Platform Performance section below stays honestly
// "Not connected" for all of those until a real Hootsuite integration
// exists — no zero values, no placeholders dressed up as data.
export function SocialScreen() {
  const ga4SocialTraffic = useAppStore((s) => s.ga4SocialTraffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4SocialTraffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4SocialTraffic]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  const socialTraffic = useMemo(
    () => getSocialTraffic(ga4SocialTraffic, isGroupView, selectedEntity),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );
  const socialByNetwork = useMemo(
    () => getSocialNetworkBreakdown(ga4SocialTraffic, isGroupView, selectedEntity),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );
  const socialTopLandingPages = useMemo(
    () => getSocialTopLandingPages(ga4SocialTraffic, isGroupView, selectedEntity, 10),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );
  const socialEnquiries = useMemo(
    () => getSocialEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const socialEnquiriesBySource = useMemo(
    () => getSocialEnquiriesBySource(ga4Enquiries, isGroupView, selectedEntity, 10),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  // Social Enquiry Rate = Social GA4 Enquiries ÷ Social Sessions × 100 —
  // both genuine GA4 figures, only computed when both sides are real.
  const socialEnquiryRate =
    socialTraffic.status === 'available' &&
    socialTraffic.sessions! > 0 &&
    socialEnquiries.status === 'available' &&
    socialEnquiries.total !== undefined
      ? Math.round((socialEnquiries.total / socialTraffic.sessions!) * 1000) / 10
      : null;

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const ga4SocialConfigured = ga4SocialTraffic?.configured === true;
  const ga4SocialHasErrors = (ga4SocialTraffic?.errors?.length ?? 0) > 0;

  const freshnessEntries: FreshnessEntry[] = [
    ga4SocialConfigured
      ? { label: 'GA4 Social Traffic', status: ga4SocialHasErrors ? 'error' : 'live', detail: ga4SocialHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'GA4 Social Traffic', status: 'not-connected', detail: 'Not connected' },
    { label: 'Hootsuite', status: 'not-connected', detail: 'Not connected' },
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Social</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Website traffic from social across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="mb-8">
          <h2 className="v2-section-title">Social Traffic</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real GA4 website traffic attributed to Organic/Paid Social via GA4's own channel classification — sessions
            and users only. Impressions, reach, engagement, and followers are platform-side metrics GA4 can't see.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Social Sessions"
              value={socialTraffic.status === 'available' ? socialTraffic.sessions : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.subtitle}
              accent="var(--v2-purple)"
            />
            <KpiCard
              title="Social Users"
              value={socialTraffic.status === 'available' ? socialTraffic.users : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.subtitle}
              accent="var(--v2-purple)"
            />
            <KpiCard
              title="Organic Social"
              value={socialTraffic.status === 'available' ? `${socialTraffic.organicSessions} sessions` : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.status === 'available' ? `${socialTraffic.organicUsers} users` : socialTraffic.subtitle}
              accent="var(--v2-green)"
            />
            <KpiCard
              title="Paid Social"
              value={socialTraffic.status === 'available' ? `${socialTraffic.paidSessions} sessions` : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.status === 'available' ? `${socialTraffic.paidUsers} users` : socialTraffic.subtitle}
              accent="var(--v2-orange)"
            />
          </div>
        </div>

        {/* Social Traffic by Source */}
        <div className="mb-8">
          <h2 className="v2-section-title">Social Traffic by Source</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Raw GA4 sessionSource (referring domain) — GA4 doesn't provide a canonical platform name, so sources are
            shown exactly as reported, never relabelled or bucketed into "LinkedIn"/"Facebook"/"Instagram".
          </p>
          {socialByNetwork.status === 'available' ? (
            socialByNetwork.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 420 }}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Sessions</th>
                        <th style={{ textAlign: 'right' }}>Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socialByNetwork.rows.map((row) => (
                        <tr key={row.source}>
                          <td className="text-text-primary">{row.source}</td>
                          <td style={{ textAlign: 'right' }}>{row.sessions}</td>
                          <td style={{ textAlign: 'right' }}>{row.users}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No social traffic in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{socialByNetwork.subtitle}</p>
            </div>
          )}
        </div>

        {/* GA4 Enquiries from Social */}
        <div className="mb-8">
          <h2 className="v2-section-title">GA4 Enquiries from Social</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Verified GA4 key events (see Reports → Website Enquiries) restricted to Organic/Paid Social sessions — a
            website action, not a qualified marketing lead.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard
              title="GA4 Enquiries from Social"
              value={socialEnquiries.status === 'available' ? socialEnquiries.total : undefined}
              status={socialEnquiries.status}
              subtitle={socialEnquiries.subtitle}
              size="compact"
            />
            <KpiCard
              title="Social Enquiry Rate"
              value={socialEnquiryRate !== null ? `${socialEnquiryRate}%` : undefined}
              status={socialEnquiryRate !== null ? 'available' : 'not-connected'}
              subtitle={socialEnquiryRate !== null ? 'GA4 Enquiries from Social ÷ Social Sessions' : socialEnquiries.subtitle}
              size="compact"
            />
            <KpiCard
              title="Organic Social Enquiries"
              value={socialEnquiries.status === 'available' ? socialEnquiries.organic : undefined}
              status={socialEnquiries.status}
              subtitle={socialEnquiries.subtitle}
              size="compact"
            />
            <KpiCard
              title="Paid Social Enquiries"
              value={socialEnquiries.status === 'available' ? socialEnquiries.paid : undefined}
              status={socialEnquiries.status}
              subtitle={socialEnquiries.subtitle}
              size="compact"
            />
          </div>

          <h4 className="text-sm font-semibold text-text-primary mb-2">Enquiries from Social by Source</h4>
          {socialEnquiriesBySource.status === 'available' ? (
            socialEnquiriesBySource.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Enquiries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socialEnquiriesBySource.rows.map((row) => (
                        <tr key={row.source}>
                          <td className="text-text-primary">{row.source}</td>
                          <td style={{ textAlign: 'right' }}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No social enquiries in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{socialEnquiriesBySource.subtitle}</p>
            </div>
          )}
        </div>

        {/* Top Landing Pages from Social */}
        <div className="mb-8">
          <h2 className="v2-section-title">Top Landing Pages from Social</h2>
          {socialTopLandingPages.status === 'available' ? (
            socialTopLandingPages.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 420 }}>
                    <thead>
                      <tr>
                        <th>Landing Page</th>
                        <th style={{ textAlign: 'right' }}>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socialTopLandingPages.rows.map((row) => (
                        <tr key={row.landingPage}>
                          <td
                            className="text-text-primary text-xs"
                            style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={row.landingPage}
                          >
                            {row.landingPage}
                          </td>
                          <td style={{ textAlign: 'right' }}>{row.sessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No social landing pages recorded in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{socialTopLandingPages.subtitle}</p>
            </div>
          )}
        </div>

        {/* Platform Performance — reserved for a future Hootsuite
            integration. Every figure here is genuinely unavailable today;
            none are fabricated as zero. */}
        <div className="mb-4">
          <h2 className="v2-section-title">Platform Performance</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Requires a real Hootsuite (or direct platform API) integration — not built yet. Nothing below is
            estimated or guessed.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <KpiCard title="Impressions" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
            <KpiCard title="Reach" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
            <KpiCard title="Engagement" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
            <KpiCard title="Followers" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
            <KpiCard title="Follower Growth" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
            <KpiCard title="Posts Published" status="not-connected" subtitle="Awaiting Hootsuite integration" size="compact" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Top Posts</h3>
          <div className="card p-4">
            <p className="text-sm text-text-secondary">Awaiting Hootsuite integration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
