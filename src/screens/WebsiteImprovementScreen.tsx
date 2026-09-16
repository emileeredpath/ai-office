import { useEffect, useMemo, useState } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';
import { useAuth } from '@/contexts/AuthContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { fetchGa4Traffic, type Ga4TrafficResponse } from '@/services/ga4Api';
import { fetchGoogleAdsPerformance, type GoogleAdsResponse } from '@/services/googleAdsApi';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveSearchConsoleDateRange } from '@/utils/searchConsole';
import { useAppStore } from '@/store/useAppStore';
import {
  fetchWebsiteImprovements, fetchWebsiteSites, createWebsiteImprovement, updateWebsiteImprovement,
  type WebsiteSite, type WebsiteImprovement,
} from '@/services/websiteImprovementsApi';

type Draft = {
  siteId: string; pageUrl: string; pageType: string; improvementType: string; title: string; reason: string;
  priority: WebsiteImprovement['priority']; status: WebsiteImprovement['status']; implementedOn: string;
  implementedBy: string; baselineStart: string; baselineEnd: string; measurementStart: string;
  measurementEnd: string; confidence: '' | 'Low' | 'Medium' | 'High'; competingActivity: string; notes: string;
};
const emptyDraft: Draft = {
  siteId: '', pageUrl: '', pageType: '', improvementType: 'Content', title: '', reason: '',
  priority: 'Medium', status: 'Suggested', implementedOn: '', implementedBy: '',
  baselineStart: '', baselineEnd: '', measurementStart: '', measurementEnd: '', confidence: '', competingActivity: '', notes: '',
};
const statuses: WebsiteImprovement['status'][] = ['Suggested', 'Approved', 'Planned', 'In Progress', 'Live', 'Measuring', 'Successful', 'Inconclusive', 'Reverted'];

function fromRow(row: WebsiteImprovement): Draft {
  return {
    siteId: row.site_id, pageUrl: row.page_url ?? '', pageType: row.page_type ?? '',
    improvementType: row.improvement_type, title: row.title, reason: row.reason,
    priority: row.priority, status: row.status, implementedOn: row.implemented_on ?? '',
    implementedBy: row.implemented_by ?? '', baselineStart: row.baseline_start ?? '', baselineEnd: row.baseline_end ?? '',
    measurementStart: row.measurement_start ?? '', measurementEnd: row.measurement_end ?? '',
    confidence: row.confidence ?? '', competingActivity: row.competing_activity ?? '', notes: row.notes ?? '',
  };
}

function toPayload(draft: Draft, channel: 'website' | 'ppc'): Record<string, unknown> {
  return {
    siteId: draft.siteId, channel, pageUrl: draft.pageUrl || null, pageType: draft.pageType || null,
    improvementType: draft.improvementType, title: draft.title, reason: draft.reason,
    priority: draft.priority, status: draft.status, implementedOn: draft.implementedOn || null,
    implementedBy: draft.implementedBy || null, baselineStart: draft.baselineStart || null,
    baselineEnd: draft.baselineEnd || null, measurementStart: draft.measurementStart || null,
    measurementEnd: draft.measurementEnd || null, confidence: draft.confidence || null,
    competingActivity: draft.competingActivity || null, notes: draft.notes || null,
  };
}

function dateOffset(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function WebsiteImprovementScreen({ mode = 'website' }: { mode?: 'website' | 'ppc' }) {
  const { period } = usePeriod();
  const { isEditor } = useAuth();
  const searchConsole = useAppStore((s) => s.searchConsolePerformance);
  const syncSearchConsole = useAppStore((s) => s.syncSearchConsolePerformance);
  const [sites, setSites] = useState<WebsiteSite[]>([]);
  const [rows, setRows] = useState<WebsiteImprovement[]>([]);
  const [ga4, setGa4] = useState<Ga4TrafficResponse | null>(null);
  const [googleAds, setGoogleAds] = useState<GoogleAdsResponse | null>(null);
  const [adsLoading, setAdsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ga4Loading, setGa4Loading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [windowSessions, setWindowSessions] = useState<{ before: number | null; after: number | null; state: string }>({ before: null, after: null, state: '' });
  const range = useMemo(() => resolveGa4DateRange(period), [period]);
  const searchRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  const adsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);

  useEffect(() => { if (mode === 'website') syncSearchConsole(searchRange.startDate, searchRange.endDate); }, [mode, searchRange.startDate, searchRange.endDate, syncSearchConsole]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchWebsiteSites(), fetchWebsiteImprovements(mode)])
      .then(([nextSites, nextRows]) => { if (active) { setSites(nextSites); setRows(nextRows); } })
      .catch(() => { if (active) setError('Could not load the improvement log.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'ppc') return;
    let active = true;
    setAdsLoading(true);
    fetchGoogleAdsPerformance(adsRange.startDate, adsRange.endDate)
      .then((data) => { if (active) setGoogleAds(data); })
      .catch(() => { if (active) setGoogleAds(null); })
      .finally(() => { if (active) setAdsLoading(false); });
    return () => { active = false; };
  }, [mode, adsRange.startDate, adsRange.endDate]);

  useEffect(() => {
    let active = true;
    if (mode === 'ppc') {
      setWindowSessions({ before: null, after: null, state: 'Comparable paid landing-page sessions and verified paid leads are not connected.' });
      return;
    }
    setGa4Loading(true);
    setGa4(null);
    fetchGa4Traffic(range.startDate, range.endDate)
      .then((data) => { if (active) setGa4(data); })
      .catch(() => { if (active) setGa4(null); })
      .finally(() => { if (active) setGa4Loading(false); });
    return () => { active = false; };
  }, [range.startDate, range.endDate]);

  const visibleRows = rows.filter((row) => selectedSite === 'all' || row.site_id === selectedSite);
  const selected = selectedId ? rows.find((row) => row.id === selectedId) : null;
  useEffect(() => {
    let active = true;
    if (!selected?.baseline_start || !selected.baseline_end || !selected.measurement_start || !selected.measurement_end) {
      setWindowSessions({ before: null, after: null, state: 'Set both complete date windows to compare GA4 sessions.' });
      return;
    }
    if (selected.measurement_end >= new Date().toISOString().slice(0, 10)) {
      setWindowSessions({ before: null, after: null, state: 'The measurement window is still open. Do not treat it as a final result.' });
      return;
    }
    const site = sites.find((item) => item.id === selected.site_id);
    if (!site?.brand) { setWindowSessions({ before: null, after: null, state: 'No GA4 property is mapped to this website.' }); return; }
    setWindowSessions({ before: null, after: null, state: 'Loading GA4 sessions for both windows…' });
    Promise.all([
      fetchGa4Traffic(selected.baseline_start, selected.baseline_end),
      fetchGa4Traffic(selected.measurement_start, selected.measurement_end),
    ]).then(([before, after]) => {
      if (!active) return;
      const b = before.brands.find((item) => item.brand === site.brand);
      const a = after.brands.find((item) => item.brand === site.brand);
      setWindowSessions(b && a ? { before: b.sessions, after: a.sessions, state: 'GA4 website-wide sessions; these are not page-level sessions or leads.' } :
        { before: null, after: null, state: 'GA4 did not return both windows for this website.' });
    }).catch(() => { if (active) setWindowSessions({ before: null, after: null, state: 'GA4 could not load the comparison.' }); });
    return () => { active = false; };
  }, [mode, selected?.id, selected?.site_id, selected?.baseline_start, selected?.baseline_end, selected?.measurement_start, selected?.measurement_end, sites]);
  const measuredSites = sites.filter((site) => site.brand && ga4?.brands.some((item) => item.brand === site.brand));
  const allMeasured = sites.length > 0 && measuredSites.length === sites.length && (ga4?.errors.length ?? 0) === 0;
  const sessions = measuredSites.reduce((sum, site) => sum + (ga4?.brands.find((row) => row.brand === site.brand)?.sessions ?? 0), 0);
  const adsSummary = getGoogleAdsSummary(googleAds, true, 'mtech');

  const selectRow = (row: WebsiteImprovement) => { setSelectedId(row.id); setDraft(fromRow(row)); setError(''); };
  const startNew = () => { setSelectedId('new'); setDraft({ ...emptyDraft, siteId: selectedSite !== 'all' ? selectedSite : (sites[0]?.id ?? ''), improvementType: mode === 'ppc' ? 'PPC landing page' : 'Content' }); setError(''); };
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setImplementedOn = (value: string) => setDraft((current) => ({
    ...current, implementedOn: value,
    baselineStart: value && !current.baselineStart ? dateOffset(value, -28) : current.baselineStart,
    baselineEnd: value && !current.baselineEnd ? dateOffset(value, -1) : current.baselineEnd,
    measurementStart: value && !current.measurementStart ? dateOffset(value, 1) : current.measurementStart,
    measurementEnd: value && !current.measurementEnd ? dateOffset(value, 28) : current.measurementEnd,
  }));
  const save = async () => {
    if (!draft.siteId || !draft.title.trim() || !draft.improvementType.trim()) { setError('Add a website, change and improvement type.'); return; }
    if (draft.baselineStart && draft.baselineEnd && draft.baselineStart > draft.baselineEnd) { setError('The baseline dates are reversed.'); return; }
    if (draft.measurementStart && draft.measurementEnd && draft.measurementStart > draft.measurementEnd) { setError('The measurement dates are reversed.'); return; }
    setSaving(true); setError('');
    try {
      const result = selected ? await updateWebsiteImprovement(selected.id, toPayload(draft, selected.channel)) : await createWebsiteImprovement(toPayload(draft, mode));
      setRows((current) => selected ? current.map((row) => row.id === result.id ? result : row) : [result, ...current]);
      setSelectedId(result.id);
    } catch { setError('Could not save this improvement. Check the details and try again.'); }
    finally { setSaving(false); }
  };

  return <div className="v2-page"><div className="max-w-7xl mx-auto space-y-6">
    <div className="v2-page-header"><div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">{mode === 'ppc' ? 'PPC Improvement' : 'Website Improvement'}</h1>
      <p className="text-text-secondary">{mode === 'ppc' ? 'Track paid search changes, landing-page work and what to improve next.' : 'Track what we change, what improves and where the next lead opportunity is.'}</p>
    </div><PeriodSelector /></div>

    {mode === 'website' ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard title="Website Leads" status="not-connected" notConnectedLabel="Not available" subtitle="A verified website-origin lead source is needed." accent="var(--v2-orange)" />
      <KpiCard title="Website Conversion Rate" status="not-connected" notConnectedLabel="Not available" subtitle="Website Leads ÷ eligible sessions. Lead source and eligibility are not yet confirmed." accent="var(--v2-blue)" />
      <KpiCard title="Conversion Rate Change" status="not-connected" notConnectedLabel="Not available" subtitle="Requires current and previous equivalent conversion rates." accent="var(--v2-purple)" />
      <KpiCard title="GA4 Website Sessions" value={ga4Loading ? 'Loading…' : allMeasured ? sessions.toLocaleString('en-GB') : undefined} status={ga4Loading || allMeasured ? 'available' : 'not-connected'} notConnectedLabel="Incomplete" subtitle={allMeasured ? `${range.startDate} to ${range.endDate}` : `${measuredSites.length} of ${sites.length} sites returned data; no group total shown`} accent="var(--v2-green)" />
    </div> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard title="Google Ads Clicks" value={adsLoading ? 'Loading…' : adsSummary.status === 'available' ? adsSummary.clicks!.toLocaleString('en-GB') : undefined} status={adsLoading || adsSummary.status === 'available' ? 'available' : 'not-connected'} subtitle={adsSummary.subtitle} accent="var(--v2-blue)" />
      <KpiCard title="Google Ads Spend" value={adsLoading ? 'Loading…' : adsSummary.status === 'available' ? `£${adsSummary.spend!.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined} status={adsLoading || adsSummary.status === 'available' ? 'available' : 'not-connected'} subtitle={adsSummary.subtitle} accent="var(--v2-orange)" />
      <KpiCard title="Google Ads Conversions" value={adsLoading ? 'Loading…' : adsSummary.status === 'available' ? adsSummary.conversions : undefined} status={adsLoading || adsSummary.status === 'available' ? 'available' : 'not-connected'} subtitle="Google Ads' own conversion metric; not verified leads" accent="var(--v2-purple)" />
      <KpiCard title="PPC Lead Conversion Rate" status="not-connected" notConnectedLabel="Not available" subtitle="Needs paid landing-page sessions and verified paid leads." accent="var(--v2-green)" />
    </div>}

    <div className="card p-5 border-l-4" style={{ borderColor: 'var(--v2-orange)' }}>
      <h2 className="font-bold text-text-primary mb-1">Measurement status</h2>
      <p className="text-sm text-text-secondary">{mode === 'website' ? 'GA4 sessions describe visits. Existing verified GA4 enquiry actions are not CRM leads, so they are not used as Website Leads or a lead conversion rate. Best improving site, site needing attention and before/after lead impact remain unranked until comparable lead data exists. A recorded change is not proof that it caused a result.' : 'Google Ads clicks and conversions describe the ad account, not individual landing-page journeys or verified CRM leads. PPC lead conversion and before/after impact remain unavailable until exact landing pages, paid sessions and leads can be matched. A recorded change is not proof that it caused a result.'}</p>
      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        <span className="rounded px-2 py-1 bg-slate-100">GA4: {ga4Loading ? 'Checking' : ga4?.configured && measuredSites.length ? ga4.errors.length ? 'Partial / error' : 'Connected' : 'Not connected'}</span>
        {mode === 'website' && <span className="rounded px-2 py-1 bg-slate-100">Search Console: {searchConsole?.configured ? searchConsole.errors.length ? 'Partial / error' : 'Connected' : 'Not connected'}</span>}
        <span className="rounded px-2 py-1 bg-slate-100">Google Ads: {mode === 'website' ? 'Not assessed here' : adsLoading ? 'Checking' : googleAds?.configured ? googleAds.errors.length ? 'Partial / error' : 'Connected' : 'Not connected'}</span>
        <span className="rounded px-2 py-1 bg-slate-100">Infinity: Not assessed for {mode === 'ppc' ? 'paid leads' : 'website leads'}</span>
        <span className="rounded px-2 py-1 bg-slate-100">CRM {mode === 'ppc' ? 'paid' : 'website'} attribution: Not verified</span>
      </div>
    </div>

    {mode === 'website' ? <section className="card p-5"><h2 className="v2-section-title">Website performance</h2>
      <p className="text-xs text-text-secondary mb-3">GA4 sessions for the selected period. Lead metrics remain unavailable rather than showing a false zero.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b text-text-secondary"><th className="py-2">Website</th><th>Sessions</th><th>Website leads</th><th>Lead conversion rate</th><th>Improvement status</th></tr></thead><tbody>
        {sites.map((site) => { const entry = ga4?.brands.find((row) => row.brand === site.brand); const count = rows.filter((row) => row.site_id === site.id && row.status !== 'Suggested').length; return <tr key={site.id} className="border-b last:border-0">
          <td className="py-3"><a className="font-medium text-text-primary underline" href={site.url} target="_blank" rel="noopener noreferrer">{site.name} ↗</a></td>
          <td className="tabular-nums">{ga4Loading ? 'Loading…' : entry ? entry.sessions.toLocaleString('en-GB') : 'Not connected'}</td>
          <td>Not available</td><td>Not available</td><td>{count ? `${count} in progress or measured` : 'Suggested backlog only'}</td>
        </tr>; })}
      </tbody></table></div>
    </section> : <section className="card p-5"><h2 className="v2-section-title">Paid performance by entity</h2>
      <p className="text-xs text-text-secondary mb-3">Google Ads account totals for the selected period. These figures are not assigned to individual website pages.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b text-text-secondary"><th className="py-2">Entity</th><th>Clicks</th><th>Spend</th><th>Google Ads conversions</th><th>Paid leads</th></tr></thead><tbody>
        {sites.map((site) => { const entry = googleAds?.brands.find((row) => row.brand === site.brand); return <tr key={site.id} className="border-b last:border-0"><td className="py-3 font-medium">{site.name}</td><td>{adsLoading ? 'Loading…' : entry ? entry.clicks.toLocaleString('en-GB') : 'Not connected'}</td><td>{adsLoading ? 'Loading…' : entry ? `£${entry.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not connected'}</td><td>{adsLoading ? 'Loading…' : entry ? entry.conversions.toLocaleString('en-GB') : 'Not connected'}</td><td>Not available</td></tr>; })}
      </tbody></table></div>
    </section>}

    <section className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 className="v2-section-title mb-1">{mode === 'ppc' ? 'PPC improvement log' : 'Improvement log'}</h2><p className="text-xs text-text-secondary">{mode === 'ppc' ? 'Paid landing-page recommendations share the Website log so each change has one record. Add further paid improvements here.' : 'Audit recommendations start as Suggested. Select one to plan, record and review it.'}</p></div><div className="flex gap-2"><select className="input" aria-label="Filter website" value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)}><option value="all">All websites</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select>{isEditor && <button className="btn btn-primary" onClick={startNew}>Add improvement</button>}</div></div>
      {loading ? <p className="text-sm text-text-secondary">Loading improvement log…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b text-text-secondary"><th className="py-2">ID</th><th>Website</th><th>Improvement</th><th>Priority</th><th>Status</th><th>Implemented</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="py-2"><button className="underline font-medium text-text-primary" onClick={() => selectRow(row)}>{row.id}</button></td><td>{sites.find((site) => site.id === row.site_id)?.name ?? row.site_id}</td><td>{row.title}</td><td>{row.priority}</td><td>{row.status}</td><td>{row.implemented_on ?? '—'}</td></tr>)}</tbody></table></div>}
    </section>

    {selectedId && <section className="card p-5"><div className="flex justify-between gap-3"><h2 className="v2-section-title">{selected ? `${selected.id} · ${selected.title}` : 'New improvement'}</h2><button className="btn btn-secondary" onClick={() => setSelectedId(null)}>Close</button></div>
      {selected?.page_url ? <a href={selected.page_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Open affected page ↗</a> : selected ? <p className="text-xs text-text-secondary">Exact page URL has not been identified.</p> : null}
      <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
        <label>Website<select className="input mt-1 w-full" value={draft.siteId} disabled={!isEditor} onChange={(e) => setField('siteId', e.target.value)}>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
        <label>Page URL<input className="input mt-1 w-full" type="url" value={draft.pageUrl} disabled={!isEditor} onChange={(e) => setField('pageUrl', e.target.value)} placeholder="Exact page, when confirmed" /></label>
        <label>Change<input className="input mt-1 w-full" value={draft.title} disabled={!isEditor} onChange={(e) => setField('title', e.target.value)} /></label>
        <label>Improvement type<input className="input mt-1 w-full" value={draft.improvementType} disabled={!isEditor} onChange={(e) => setField('improvementType', e.target.value)} /></label>
        <label>Page type<input className="input mt-1 w-full" value={draft.pageType} disabled={!isEditor} onChange={(e) => setField('pageType', e.target.value)} /></label>
        <label>Priority<select className="input mt-1 w-full" value={draft.priority} disabled={!isEditor} onChange={(e) => setField('priority', e.target.value as Draft['priority'])}>{['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Status<select className="input mt-1 w-full" value={draft.status} disabled={!isEditor} onChange={(e) => setField('status', e.target.value as Draft['status'])}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Implemented by<input className="input mt-1 w-full" value={draft.implementedBy} disabled={!isEditor} onChange={(e) => setField('implementedBy', e.target.value)} /></label>
        <label>Date implemented<input className="input mt-1 w-full" type="date" value={draft.implementedOn} disabled={!isEditor} onChange={(e) => setImplementedOn(e.target.value)} /></label>
        <label>Attribution confidence<select className="input mt-1 w-full" value={draft.confidence} disabled={!isEditor} onChange={(e) => setField('confidence', e.target.value as Draft['confidence'])}><option value="">Not assessed</option>{['Low', 'Medium', 'High'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="md:col-span-2">Reason and recommendation<textarea className="input mt-1 w-full min-h-20" value={draft.reason} disabled={!isEditor} onChange={(e) => setField('reason', e.target.value)} /></label>
      </div>
      <div className="mt-5 border-t pt-4"><h3 className="font-bold text-text-primary">Before and after measurement</h3><p className="text-xs text-text-secondary mb-3">{mode === 'ppc' ? '28-day windows are suggested when a change goes live. Paid landing-page sessions and verified paid leads are not yet connected, so conversion impact cannot be calculated.' : '28-day windows are suggested when an implementation date is entered. Adjust for comparable complete periods. Sessions and verified website leads must cover the same site and dates; no lead difference is calculated until that data is connected.'}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">{([['baselineStart', 'Baseline start'], ['baselineEnd', 'Baseline end'], ['measurementStart', 'Measurement start'], ['measurementEnd', 'Measurement end']] as const).map(([key, label]) => <label key={key}>{label}<input type="date" className="input mt-1 w-full" value={draft[key]} disabled={!isEditor} onChange={(e) => setField(key, e.target.value)} /></label>)}</div>
        {selected && <p className="text-sm text-text-secondary mt-3">Before sessions: {windowSessions.before === null ? 'Not available' : windowSessions.before.toLocaleString('en-GB')} · After sessions: {windowSessions.after === null ? 'Not available' : windowSessions.after.toLocaleString('en-GB')}. {windowSessions.state}</p>}
        {selected && (draft.baselineStart !== (selected.baseline_start ?? '') || draft.baselineEnd !== (selected.baseline_end ?? '') || draft.measurementStart !== (selected.measurement_start ?? '') || draft.measurementEnd !== (selected.measurement_end ?? '')) && <p className="text-xs text-text-secondary mt-1">Save the date changes to refresh this comparison.</p>}
        <p className="text-sm text-text-secondary mt-3">Baseline rate: Not available · After rate: Not available · Percentage point change: Not available · Relative change: Not available · Estimated lead difference: Not available</p>
        <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm"><label>Other activity during measurement<textarea className="input mt-1 w-full" value={draft.competingActivity} disabled={!isEditor} onChange={(e) => setField('competingActivity', e.target.value)} /></label><label>Notes / interpretation<textarea className="input mt-1 w-full" value={draft.notes} disabled={!isEditor} onChange={(e) => setField('notes', e.target.value)} /></label></div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 mt-3">{error}</p>}
      {isEditor && <button className="btn btn-primary mt-4" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save improvement'}</button>}
    </section>}
    {!selectedId && error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div></div>;
}
