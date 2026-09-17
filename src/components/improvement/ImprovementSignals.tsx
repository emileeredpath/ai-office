import { useMemo } from 'react';
import type { Brand } from '@/types/index';
import type { Ga4WebsiteJourneyResponse } from '@/services/ga4Api';
import type { GoogleAdsResponse } from '@/services/googleAdsApi';
import type { WebsiteSite } from '@/services/websiteImprovementsApi';
import type { EntitySelection } from '@/contexts/EntityContext';
import { getWebsiteImprovementSignals } from '@/utils/improvementSignals';
import { getGa4PageUrl } from '@/utils/websitePageLinks';
import { getGoogleAdsCampaigns } from '@/utils/googleAdsPerformance';

const compactNumber = (value: number) => value.toLocaleString('en-GB');

function PageLabel({ brand, path, sites }: { brand: Brand; path: string; sites: WebsiteSite[] }) {
  const href = getGa4PageUrl(brand, path);
  const site = sites.find((item) => item.brand === brand);
  return <span className="min-w-0">
    {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:underline break-all">{path} ↗</a> : <span className="font-semibold text-text-primary break-all">{path}</span>}
    <span className="block text-xs text-text-secondary truncate">{site?.name ?? brand}</span>
  </span>;
}

function MiniBar({ value, maximum, colour }: { value: number; maximum: number; colour: string }) {
  return <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden" aria-hidden="true">
    <div className="h-full rounded-full" style={{ width: `${maximum > 0 ? (value / maximum) * 100 : 0}%`, backgroundColor: colour }} />
  </div>;
}

export function WebsiteSignals({ journey, loading, sites }: {
  journey: Ga4WebsiteJourneyResponse | null; loading: boolean; sites: WebsiteSite[];
}) {
  const brands = useMemo(() => sites.map((site) => site.brand).filter((brand): brand is Brand => Boolean(brand)) as Brand[], [sites]);
  const signals = useMemo(() => getWebsiteImprovementSignals(journey, brands), [journey, brands]);
  const lists = [
    { title: 'People enter here', subtitle: 'GA4 landing sessions', rows: signals.entries.map((row) => ({ ...row, count: row.sessions })), reported: signals.reportedSites, colour: '#3B82F6' },
    { title: 'Pages they view', subtitle: 'GA4 page views', rows: signals.viewed, reported: signals.viewedReportedSites, colour: '#8B5CF6' },
    { title: 'Enquiry action pages', subtitle: 'Verified GA4 events, not CRM leads', rows: signals.enquiryActions, reported: signals.enquiryReportedSites, colour: '#16A34A' },
  ];
  const configuredEnquiry = journey?.enquiryConfiguredBrands.some((brand) => brands.includes(brand)) ?? false;

  if (!loading && sites.length === 0) return <section className="card p-5"><h2 className="v2-section-title mb-1">Where people go</h2><p className="text-sm text-text-secondary">No website is mapped to this entity, so there is no page journey to show.</p></section>;

  return <section className="space-y-3">
    <div className="flex flex-wrap justify-between items-end gap-2">
      <div><h2 className="v2-section-title mb-1">Where people go</h2><p className="text-xs text-text-secondary">Three separate GA4 views of the selected websites, not a linked visitor path.</p></div>
      <span className="text-xs font-semibold rounded-full px-3 py-1 bg-blue-50 text-blue-800">{loading ? 'Loading GA4…' : journey?.configured ? `${signals.reportedSites} of ${signals.selectedSites} entry reports` : 'GA4 unavailable'}</span>
    </div>
    <div className="grid lg:grid-cols-3 gap-3">
      {lists.map((list, index) => <div key={list.title} className="card p-4" style={{ borderTop: `4px solid ${list.colour}` }}>
        <h3 className="font-bold text-text-primary">{list.title}</h3><p className="text-xs text-text-secondary mb-3">{list.subtitle} · {loading ? 'checking' : journey?.configured ? `${list.reported}/${signals.selectedSites} sites reporting` : 'source unavailable'}</p>
        {loading ? <p className="text-sm text-text-secondary">Loading…</p> : !journey?.configured ? <p className="text-sm text-text-secondary">GA4 page report unavailable.</p> : index === 2 && !configuredEnquiry ? <p className="text-sm text-text-secondary">No verified enquiry definition for these websites.</p> : list.reported === 0 ? <p className="text-sm text-text-secondary">GA4 page report unavailable.</p> : list.rows.length === 0 ? <p className="text-sm text-text-secondary">{index === 2 ? 'No enquiry actions recorded in this period.' : 'No page activity recorded in this period.'}</p> :
          <ol className="space-y-3">{list.rows.map((row) => <li key={`${row.brand}:${row.pagePath}`}>
            <div className="flex justify-between gap-3 text-sm"><PageLabel brand={row.brand} path={row.pagePath} sites={sites} /><strong className="tabular-nums whitespace-nowrap">{compactNumber(row.count)}</strong></div>
            <MiniBar value={row.count} maximum={list.rows[0]?.count ?? 0} colour={list.colour} />
          </li>)}</ol>}
      </div>)}
    </div>
    <div className="card p-4" style={{ borderLeft: '4px solid #F59E0B' }}>
      <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold text-text-primary">Engagement watch</h3><p className="text-xs text-text-secondary">Higher GA4 bounce rate among the ten busiest entry pages. A review signal, not a measured drop-off.</p></div><span className="text-xl" aria-hidden="true">↘</span></div>
      {loading ? <p className="text-sm text-text-secondary mt-3">Loading…</p> : signals.reportedSites === 0 ? <p className="text-sm text-text-secondary mt-3">GA4 entry-page reporting unavailable.</p> : signals.engagementWatch.length === 0 ? <p className="text-sm text-text-secondary mt-3">No higher-bounce entry pages found among the busiest reported pages.</p> :
        <div className="grid md:grid-cols-3 gap-3 mt-3">{signals.engagementWatch.map((row) => <div key={`${row.brand}:${row.pagePath}`} className="rounded-lg bg-amber-50 p-3 min-w-0">
          <PageLabel brand={row.brand} path={row.pagePath} sites={sites} />
          <div className="flex items-baseline justify-between mt-2"><strong className="text-xl text-amber-800 tabular-nums">{(row.bounceRate * 100).toFixed(1)}%</strong><span className="text-xs text-text-secondary">{compactNumber(row.sessions)} sessions</span></div>
          <MiniBar value={row.bounceRate} maximum={1} colour="#F59E0B" />
        </div>)}</div>}
    </div>
  </section>;
}

export function PpcSignals({ googleAds, loading, isGroupView, selectedEntity }: { googleAds: GoogleAdsResponse | null; loading: boolean; isGroupView: boolean; selectedEntity: EntitySelection }) {
  const campaigns = useMemo(() => getGoogleAdsCampaigns(googleAds, isGroupView, selectedEntity), [googleAds, isGroupView, selectedEntity]);
  const top = campaigns.rows.slice(0, 5);
  const checks = campaigns.rows.filter((row) => row.spend > 0 && row.conversions === 0).slice(0, 3);
  return <section className="grid lg:grid-cols-3 gap-3">
    <div className="card p-5 lg:col-span-2" style={{ borderTop: '4px solid #3B82F6' }}>
      <h2 className="v2-section-title mb-1">Where PPC spend goes</h2><p className="text-xs text-text-secondary mb-4">Highest-spend Google Ads campaigns in this period. Spend is not assigned to a landing page here.</p>
      {loading ? <p className="text-sm text-text-secondary">Loading Google Ads…</p> : campaigns.status !== 'available' ? <p className="text-sm text-text-secondary">Google Ads campaign data unavailable.</p> : top.length === 0 ? <p className="text-sm text-text-secondary">No campaign activity recorded in this period.</p> : <div className="space-y-3">{top.map((row) => <div key={`${row.brand}:${row.campaignId}`}>
        <div className="flex justify-between gap-3 text-sm"><div className="min-w-0"><strong className="block truncate text-text-primary">{row.campaignName}</strong><span className="text-xs text-text-secondary">{row.brand} · {compactNumber(row.clicks)} clicks · {compactNumber(row.conversions)} Ads conversions</span></div><strong className="tabular-nums whitespace-nowrap">£{row.spend.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</strong></div>
        <MiniBar value={row.spend} maximum={top[0]?.spend ?? 0} colour="#3B82F6" />
      </div>)}</div>}
    </div>
    <div className="card p-5" style={{ borderTop: '4px solid #F59E0B' }}>
      <h2 className="v2-section-title mb-1">Check tracking</h2><p className="text-xs text-text-secondary mb-4">Spend with zero Google Ads conversions recorded. Check conversion setup and destination before judging performance.</p>
      {loading ? <p className="text-sm text-text-secondary">Loading…</p> : campaigns.status !== 'available' ? <p className="text-sm text-text-secondary">Google Ads campaign data unavailable.</p> : checks.length === 0 ? <p className="text-sm text-text-secondary">No spend with zero tracked conversions among connected campaigns.</p> : <ul className="space-y-3">{checks.map((row) => <li key={`${row.brand}:${row.campaignId}`} className="rounded-lg bg-amber-50 p-3 text-sm"><strong className="block text-text-primary">{row.campaignName}</strong><span className="text-xs text-text-secondary">{row.brand} · £{row.spend.toLocaleString('en-GB', { maximumFractionDigits: 0 })} spend · 0 Ads conversions</span></li>)}</ul>}
    </div>
  </section>;
}
