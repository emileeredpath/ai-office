import { useMemo, useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Brand, Campaign, CampaignResults, CampaignStatus } from '@/types/index';
import { AddCampaignModal } from '@/components/campaigns/AddCampaignModal';
import { CampaignsTable } from '@/components/campaigns/CampaignsTable';
import { LogResultsModal } from '@/components/campaigns/LogResultsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';

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
  const { isEditor } = useAuth();
  const { selectedEntity, isGroupView } = useEntity();
  const { period } = usePeriod();

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

  const campaignEntities = (c: Campaign): Brand[] => (c.entities && c.entities.length > 0 ? c.entities : [c.brand]);

  const periodStart = useMemo(() => periodStartDate(period), [period]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Respect the global entity selector (top bar) instead of a second,
      // possibly-conflicting brand filter on this page.
      if (!isGroupView && !campaignEntities(c).includes(selectedEntity as Brand)) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterIndustry !== 'all' && c.primaryIndustry !== filterIndustry && c.secondaryIndustry !== filterIndustry && c.industry !== filterIndustry) return false;
      if (filterVendor !== 'all' && c.vendor !== filterVendor) return false;
      if (periodStart && c.startDate < periodStart && c.endDate < periodStart) return false;
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.theme.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, isGroupView, selectedEntity, filterStatus, filterIndustry, filterVendor, periodStart, searchTerm]);

  const sortedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns];
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'spend') sorted.sort((a, b) => b.spend - a.spend);
    else sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return sorted;
  }, [filteredCampaigns, sortBy]);

  const displayedCampaigns = sortedCampaigns.slice(0, displayedCount);
  const hasMore = sortedCampaigns.length > displayedCount;

  const metrics = useMemo(
    () => ({
      total: filteredCampaigns.length,
      active: filteredCampaigns.filter((c) => c.status === 'active').length,
      planned: filteredCampaigns.filter((c) => c.status === 'planning').length,
      completed: filteredCampaigns.filter((c) => c.status === 'completed').length,
      budget: filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
      spend: filteredCampaigns.reduce((sum, c) => sum + c.spend, 0),
    }),
    [filteredCampaigns]
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
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Campaigns</h1>
            <p className="text-text-secondary text-sm mt-1">
              {isGroupView ? 'Across all entities' : `Showing ${ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector />
            {isEditor && (
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
                <Plus size={18} />
                New campaign
              </button>
            )}
          </div>
        </div>

        {/* Roll-up metrics */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Total Campaigns</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{metrics.total}</p>
            </div>
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Active</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate" style={{ color: 'var(--v2-green)' }}>{metrics.active}</p>
            </div>
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Planned</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{metrics.planned}</p>
            </div>
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{metrics.completed}</p>
            </div>
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Total Budget</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{formatCurrency(metrics.budget)}</p>
            </div>
            <div className="card" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Total Spend</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{formatCurrency(metrics.spend)}</p>
              <p className="text-xs text-text-secondary mt-1">{metrics.budget > 0 ? Math.round((metrics.spend / metrics.budget) * 100) : 0}% of budget</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {campaigns.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-6">
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as CampaignStatus | 'all'); setDisplayedCount(PAGE_SIZE); }} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); setDisplayedCount(PAGE_SIZE); }} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Industries</option>
              {getUniqueIndustries().map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <select value={filterVendor} onChange={(e) => { setFilterVendor(e.target.value); setDisplayedCount(PAGE_SIZE); }} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Vendors</option>
              {getUniqueVendors().map((v) => (
                <option key={v} value={v}>{getVendorLabel(v)}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setDisplayedCount(PAGE_SIZE); }}
              className="input flex-1"
              style={{ minWidth: 150 }}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="input" style={{ maxWidth: 150 }}>
              <option value="date">Sort by date</option>
              <option value="name">Sort by name</option>
              <option value="spend">Sort by spend</option>
            </select>
          </div>
        )}

        {campaigns.length > 0 ? (
          <>
            <CampaignsTable
              campaigns={displayedCampaigns}
              isEditor={isEditor}
              acumaticaUrl={ACUMATICA_URL}
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

        {/* Acumatica */}
        <div
          className="mt-10"
          style={{
            background: 'var(--color-bg)',
            border: '0.5px solid var(--color-border)',
            borderRadius: 12,
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
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
        </div>
      </div>

      {showAddModal && <AddCampaignModal onClose={() => setShowAddModal(false)} />}
      {loggingCampaign && (
        <LogResultsModal campaign={loggingCampaign} onSave={handleSaveResults} onClose={() => setLoggingCampaign(null)} />
      )}
    </div>
  );
}
