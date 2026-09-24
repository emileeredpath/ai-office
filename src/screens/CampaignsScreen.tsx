import { getCampaignEntities } from '@/utils/campaignEntities';
import { useEffect, useMemo, useState } from 'react';
import { Plus, ExternalLink, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Brand, Campaign, CampaignResults, CampaignStatus } from '@/types/index';
import { AddCampaignModal } from '@/components/campaigns/AddCampaignModal';
import { CampaignsTable } from '@/components/campaigns/CampaignsTable';
import { LogResultsModal } from '@/components/campaigns/LogResultsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { resolveGoogleAdsDateRange } from '@/utils/googleAdsPerformance';
import { getGoogleAdsForCampaign } from '@/utils/campaignAttribution';
import { getKnownCampaignSpend } from '@/utils/campaignCosts';

const ACUMATICA_URL = 'https://brentwoodcommunications.acumatica.com/Main?CompanyID=MTECH+Brentwood+Communications+(Live)&ScreenId=DB000055';

type SortOption = 'date' | 'name' | 'spend';

const PAGE_SIZE = 15;

const getVendorLabel = (vendor: string | null | undefined) => {
  if (!vendor) return null;
  return vendor.charAt(0).toUpperCase() + vendor.slice(1);
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return '£0';
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export function CampaignsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const campaignCosts = useAppStore((s) => s.campaignCosts);
  const syncCampaignCosts = useAppStore((s) => s.syncCampaignCosts);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const { isEditor } = useAuth();
  const { selectedEntity, isGroupView } = useEntity();
  const { period } = usePeriod();

  // Known Campaign Spend is never period-scoped (same reasoning as Campaign
  // Detail: a campaign's real activity can predate or outlast whatever the
  // global Period selector happens to be set to), so this always looks
  // across everything currently synced.
  useEffect(() => {
    syncCampaignCosts();
  }, [syncCampaignCosts]);
  useEffect(() => {
    const { startDate, endDate } = resolveGoogleAdsDateRange('all-time');
    syncGoogleAdsPerformance(startDate, endDate);
  }, [syncGoogleAdsPerformance]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [loggingCampaign, setLoggingCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');
  const [filterIndustry, setFilterIndustry] = useState<string | 'all'>('all');
  const [filterVendor, setFilterVendor] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);

  const getUniqueIndustries = () => {
    const industries = new Set<string>();
    campaigns.forEach((c) => {
      if (c.primaryIndustry) industries.add(c.primaryIndustry);
      if (c.secondaryIndustry) industries.add(c.secondaryIndustry);
      if (c.industry) industries.add(c.industry);
    });
    return Array.from(industries).sort();
  };

  const getUniqueVendors = () => {
    const vendors = new Set<string>();
    campaigns.forEach((c) => {
      if (c.vendor) vendors.add(c.vendor);
    });
    return Array.from(vendors).sort();
  };

  const periodStart = useMemo(() => periodStartDate(period), [period]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Respect the global entity selector (top bar) instead of a second,
      // possibly-conflicting brand filter on this page.
      if (!isGroupView && !getCampaignEntities(c).includes(selectedEntity as Brand)) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterIndustry !== 'all' && c.primaryIndustry !== filterIndustry && c.secondaryIndustry !== filterIndustry && c.industry !== filterIndustry) return false;
      if (filterVendor !== 'all' && c.vendor !== filterVendor) return false;
      // An operationally Active campaign stays visible regardless of the
      // reporting period — the period still governs the performance
      // metrics shown for it (via the KPI totals above, which read
      // filteredCampaigns), it just must never hide a campaign someone is
      // still meant to be managing. A campaign whose end date has already
      // passed while still marked Active shows the existing "ended but
      // still active" warning treatment (getCampaignProgressInfo, used by
      // CampaignsTable below) — the period filter is not how that gets
      // surfaced or resolved. Planning/Completed/on-hold campaigns keep
      // the original date-window filtering unchanged.
      if (c.status !== 'active' && periodStart && c.startDate < periodStart && c.endDate < periodStart) return false;
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.theme.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, isGroupView, selectedEntity, filterStatus, filterIndustry, filterVendor, periodStart, searchTerm]);

  const knownSpendFor = (c: Campaign) => getKnownCampaignSpend(campaignCosts, c.id, c.spend, getGoogleAdsForCampaign(googleAdsPerformance, c)).knownCampaignSpend;

  const sortedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns];
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'spend') sorted.sort((a, b) => knownSpendFor(b) - knownSpendFor(a));
    else sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCampaigns, sortBy, campaignCosts, googleAdsPerformance]);

  const displayedCampaigns = sortedCampaigns.slice(0, displayedCount);
  const hasMore = sortedCampaigns.length > displayedCount;

  const metrics = useMemo(
    () => ({
      total: filteredCampaigns.length,
      active: filteredCampaigns.filter((c) => c.status === 'active').length,
      planned: filteredCampaigns.filter((c) => c.status === 'planning').length,
      completed: filteredCampaigns.filter((c) => c.status === 'completed').length,
      budget: filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
      // Known Campaign Spend = Fixed Costs (campaign_costs) + available
      // Google Ads spend — see src/utils/campaignCosts.ts, the one place
      // this calculation lives.
      spend: filteredCampaigns.reduce(
        (sum, c) => sum + getKnownCampaignSpend(campaignCosts, c.id, c.spend, getGoogleAdsForCampaign(googleAdsPerformance, c)).knownCampaignSpend,
        0
      ),
    }),
    [filteredCampaigns, campaignCosts, googleAdsPerformance]
  );

  const handleSaveResults = (campaignId: string, results: CampaignResults) => {
    updateCampaign(campaignId, { results });
  };

  const handleDelete = (campaign: Campaign) => {
    if (window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) {
      deleteCampaign(campaign.id);
    }
  };

  return (
    <div className="v2-page campaigns-page">
      <div className="campaigns-page-inner">
        <header className="campaigns-overview-header">
          <div>
            <div className="campaigns-eyebrow">{isGroupView ? 'MTech Group' : ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity}</div>
            <h1>Campaigns</h1>
            <p>Plan, monitor and review campaign activity across the selected reporting view.</p>
          </div>
          <div className="campaigns-header-actions">
            <PeriodSelector />
            {isEditor && (
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary campaigns-primary-action">
                <Plus size={18} />
                New campaign
              </button>
            )}
          </div>
        </header>

        {campaigns.length > 0 && (
          <div className="campaigns-summary-strip" aria-label="Campaign summary">
            <div><span>Total campaigns</span><strong>{metrics.total}</strong><small>In this view</small></div>
            <div><span>Active</span><strong>{metrics.active}</strong><small>Operational status</small></div>
            <div><span>Planning</span><strong>{metrics.planned}</strong><small>Not yet active</small></div>
            <div><span>Completed</span><strong>{metrics.completed}</strong><small>Recorded status</small></div>
            <div><span>Total budget</span><strong>{formatCurrency(metrics.budget)}</strong><small>Campaign records</small></div>
            <div><span>Known spend</span><strong>{formatCurrency(metrics.spend)}</strong><small>{metrics.budget > 0 ? `${Math.round((metrics.spend / metrics.budget) * 100)}% of recorded budget` : 'No budget recorded'}</small></div>
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="campaigns-toolbar">
            <label className="campaigns-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search campaigns</span>
              <input type="search" placeholder="Search campaigns" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setDisplayedCount(PAGE_SIZE); }} />
            </label>
            <div className="campaigns-filter-group">
            <select aria-label="Filter campaigns by status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as CampaignStatus | 'all'); setDisplayedCount(PAGE_SIZE); }}>
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select aria-label="Filter campaigns by industry" value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); setDisplayedCount(PAGE_SIZE); }}>
              <option value="all">All Industries</option>
              {getUniqueIndustries().map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <select aria-label="Filter campaigns by vendor" value={filterVendor} onChange={(e) => { setFilterVendor(e.target.value); setDisplayedCount(PAGE_SIZE); }}>
              <option value="all">All Vendors</option>
              {getUniqueVendors().map((v) => (
                <option key={v} value={v}>{getVendorLabel(v)}</option>
              ))}
            </select>
            <select aria-label="Sort campaigns" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="date">Sort by date</option>
              <option value="name">Sort by name</option>
              <option value="spend">Sort by spend</option>
            </select>
            </div>
            <span className="campaigns-result-count">{sortedCampaigns.length} campaign{sortedCampaigns.length === 1 ? '' : 's'}</span>
          </div>
        )}

        {campaigns.length > 0 ? (
          <>
            <CampaignsTable
              campaigns={displayedCampaigns}
              isEditor={isEditor}
              acumaticaUrl={ACUMATICA_URL}
              campaignCosts={campaignCosts}
              googleAdsPerformance={googleAdsPerformance}
              onSelectCampaign={selectCampaign}
              onLogResults={setLoggingCampaign}
              onDelete={handleDelete}
            />

            {hasMore && (
              <div className="mt-6 text-center">
                <button onClick={() => setDisplayedCount(displayedCount + PAGE_SIZE)} className="btn btn-secondary">
                  Load more ({sortedCampaigns.length - displayedCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-text-secondary text-center py-12">No campaigns yet. Create one to get started.</p>
        )}

        <aside className="campaigns-acumatica">
          <div>
            <p className="font-semibold text-text-primary" style={{ margin: '0 0 4px' }}>Acumatica integration</p>
            <p className="text-sm text-text-secondary" style={{ margin: 0 }}>
              Manage detailed campaign codes, budgets, and timelines in Acumatica
            </p>
          </div>
          <a
            href={ACUMATICA_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary flex items-center gap-2"
            style={{ whiteSpace: 'nowrap' }}
          >
            Open Acumatica <ExternalLink size={14} />
          </a>
        </aside>
      </div>

      {showAddModal && <AddCampaignModal onClose={() => setShowAddModal(false)} />}
      {loggingCampaign && (
        <LogResultsModal campaign={loggingCampaign} onSave={handleSaveResults} onClose={() => setLoggingCampaign(null)} />
      )}
    </div>
  );
}
