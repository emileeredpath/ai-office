import { useState } from 'react';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';
import { Brand, Campaign, CampaignResults, CampaignStatus } from '@/types/index';
import { AddCampaignModal } from '@/components/campaigns/AddCampaignModal';
import { useAuth } from '@/contexts/AuthContext';

const ACUMATICA_URL = 'https://brentwoodcommunications.acumatica.com/Main?CompanyID=MTECH+Brentwood+Communications+(Live)&ScreenId=DB000055';

type SortOption = 'date' | 'name' | 'spend';

const EMPTY_RESULTS_FORM = {
  emailOpenRate: '',
  emailClickRate: '',
  unsubscribes: '',
  landingPageVisits: '',
  enquiriesReceived: '',
  costToSend: '',
  notes: '',
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'active':
      return { backgroundColor: '#E8F7F3', color: '#0F6E56' };
    case 'planning':
      return { backgroundColor: '#EFF6FF', color: '#0369A1' };
    case 'on-hold':
      return { backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'completed':
      return { backgroundColor: '#F0FDF4', color: '#166534' };
    default:
      return { backgroundColor: '#F3F4F6', color: '#6B7280' };
  }
};

const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

const getVendorLabel = (vendor: string | null | undefined) => {
  if (!vendor) return null;
  return vendor.charAt(0).toUpperCase() + vendor.slice(1);
};

const isCampaignEnded = (endDate: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return '£0';
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export function CampaignsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const { isEditor } = useAuth();

  const [loggingCampaignId, setLoggingCampaignId] = useState<string | null>(null);
  const [resultsForm, setResultsForm] = useState(EMPTY_RESULTS_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterBrand, setFilterBrand] = useState<Brand | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');
  const [filterIndustry, setFilterIndustry] = useState<string | 'all'>('all');
  const [filterVendor, setFilterVendor] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [displayedCount, setDisplayedCount] = useState(8);

  const getCampaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter((t) => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return 0;
    const completed = campaignTasks.filter((t) => t.status === 'complete').length;
    return Math.round((completed / campaignTasks.length) * 100);
  };

  // Get unique industries from campaigns
  const getUniqueIndustries = () => {
    const industries = new Set<string>();
    campaigns.forEach((c) => {
      if (c.primaryIndustry) industries.add(c.primaryIndustry);
      if (c.secondaryIndustry) industries.add(c.secondaryIndustry);
      if (c.industry) industries.add(c.industry);
    });
    return Array.from(industries).sort();
  };

  // Get unique vendors from campaigns
  const getUniqueVendors = () => {
    const vendors = new Set<string>();
    campaigns.forEach((c) => {
      if (c.vendor) vendors.add(c.vendor);
    });
    return Array.from(vendors).sort();
  };

  const startLoggingResults = (campaignId: string, existing: CampaignResults | null) => {
    setResultsForm(
      existing
        ? {
            emailOpenRate: existing.emailOpenRate != null ? String(existing.emailOpenRate) : '',
            emailClickRate: existing.emailClickRate != null ? String(existing.emailClickRate) : '',
            unsubscribes: existing.unsubscribes != null ? String(existing.unsubscribes) : '',
            landingPageVisits: existing.landingPageVisits != null ? String(existing.landingPageVisits) : '',
            enquiriesReceived: existing.enquiriesReceived != null ? String(existing.enquiriesReceived) : '',
            costToSend: existing.costToSend != null ? String(existing.costToSend) : '',
            notes: existing.notes || '',
          }
        : EMPTY_RESULTS_FORM
    );
    setLoggingCampaignId(campaignId);
  };

  const saveResults = (campaignId: string) => {
    const toNumberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
    const results: CampaignResults = {
      emailOpenRate: toNumberOrNull(resultsForm.emailOpenRate),
      emailClickRate: toNumberOrNull(resultsForm.emailClickRate),
      unsubscribes: toNumberOrNull(resultsForm.unsubscribes),
      landingPageVisits: toNumberOrNull(resultsForm.landingPageVisits),
      enquiriesReceived: toNumberOrNull(resultsForm.enquiriesReceived),
      costToSend: toNumberOrNull(resultsForm.costToSend),
      notes: resultsForm.notes,
      loggedAt: new Date(),
    };
    updateCampaign(campaignId, { results });
    setLoggingCampaignId(null);
    setResultsForm(EMPTY_RESULTS_FORM);
  };

  const sortCampaigns = (list: Campaign[]) => {
    const sorted = [...list];
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'spend') sorted.sort((a, b) => b.spend - a.spend);
    else sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return sorted;
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterBrand !== 'all' && !(c.entities && c.entities.length > 0 ? c.entities : [c.brand]).includes(filterBrand)) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterIndustry !== 'all' && c.primaryIndustry !== filterIndustry && c.secondaryIndustry !== filterIndustry && c.industry !== filterIndustry) return false;
    if (filterVendor !== 'all' && c.vendor !== filterVendor) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.theme.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Compute roll-up metrics
  const metrics = {
    campaigns: filteredCampaigns.length,
    budget: filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    spend: filteredCampaigns.reduce((sum, c) => sum + c.spend, 0),
    leads: filteredCampaigns.reduce((sum, c) => sum + c.leads, 0),
    valueGenerated: filteredCampaigns.reduce((sum, c) => sum + (c.valueGenerated || 0), 0),
    fundableSpend: filteredCampaigns.filter((c) => c.vendor).reduce((sum, c) => sum + (c.budget || 0), 0),
  };

  const activeCampaigns = sortCampaigns(filteredCampaigns.filter((c) => c.status !== 'completed'));
  const completedCampaigns = sortCampaigns(filteredCampaigns.filter((c) => c.status === 'completed'));
  const displayedActiveCampaigns = activeCampaigns.slice(0, displayedCount);
  const hasMoreCampaigns = activeCampaigns.length > displayedCount;

  const renderCampaignGrid = (list: Campaign[], muted = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((campaign) => {
        const progress = getCampaignProgress(campaign.id);
        const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);
        const ended = isCampaignEnded(campaign.endDate);
        const isLogging = loggingCampaignId === campaign.id;
        const budget = campaign.budget || 0;
        const spend = campaign.spend || 0;
        const budgetPercent = budget > 0 ? Math.round((spend / budget) * 100) : 0;

        return (
          <div
            key={campaign.id}
            className="card hover:shadow-lg transition-shadow"
            style={muted ? { opacity: 0.72, backgroundColor: '#FAFAFA' } : undefined}
          >
            <div className="cursor-pointer" onClick={() => selectCampaign(campaign.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">{campaign.name}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(campaign.entities && campaign.entities.length > 0 ? campaign.entities : [campaign.brand]).map(
                      (entity) => (
                        <BrandBadge key={entity} brand={entity} />
                      )
                    )}
                    <span
                      className="badge text-xs font-medium"
                      style={{
                        ...getStatusBadgeStyle(campaign.status),
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>
                </div>
                {isEditor && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this campaign?')) {
                        deleteCampaign(campaign.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-text-secondary">{campaign.primaryIndustry}</p>
                  {campaign.secondaryIndustry && (
                    <p className="text-sm text-text-secondary">{campaign.secondaryIndustry}</p>
                  )}
                </div>

                <div className="text-sm text-text-secondary">
                  {formatDateShort(campaign.startDate)} - {formatDateShort(campaign.endDate)}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">Progress</span>
                  <span className="text-sm font-medium text-text-primary">{progress}%</span>
                </div>
                <div className="flex-1 bg-surface rounded h-2 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: '#3B82F6' }}
                  ></div>
                </div>
              </div>

              <div className="text-sm text-text-secondary mb-2">
                {campaignTasks.filter((t) => t.status === 'complete').length} of{' '}
                {campaignTasks.length} tasks complete
              </div>

              {/* Vendor tag */}
              {campaign.vendor && (
                <div className="text-xs mb-2">
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                    {getVendorLabel(campaign.vendor)}
                  </span>
                </div>
              )}

              {/* Budget / Spend stat */}
              <div className="text-sm text-text-secondary mb-2">
                Budget: <span className="text-text-primary font-medium">{formatCurrency(budget)}</span> |{' '}
                Spend: <span className={budgetPercent > 100 ? 'text-red-600 font-medium' : 'text-text-primary font-medium'}>
                  {formatCurrency(spend)}
                </span>{' '}
                <span className={budgetPercent > 100 ? 'text-red-600' : 'text-text-secondary'}>({budgetPercent}%)</span>
              </div>

              {/* Marketing leads */}
              <div className="text-sm text-text-secondary mb-2">
                Marketing Leads: <span className="text-text-primary font-medium">{campaign.leads}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectCampaign(campaign.id);
                }}
                className="text-sm font-medium"
                style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                View Campaign →
              </button>
            </div>

            {/* Results — display once logged */}
            {campaign.results && !isLogging && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-text-secondary mb-2">RESULTS</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                  {campaign.results.emailOpenRate != null && (
                    <div>Open rate: <span className="text-text-primary font-medium">{campaign.results.emailOpenRate}%</span></div>
                  )}
                  {campaign.results.emailClickRate != null && (
                    <div>Click rate: <span className="text-text-primary font-medium">{campaign.results.emailClickRate}%</span></div>
                  )}
                  {campaign.results.unsubscribes != null && (
                    <div>Unsubscribes: <span className="text-text-primary font-medium">{campaign.results.unsubscribes}</span></div>
                  )}
                  {campaign.results.landingPageVisits != null && (
                    <div>Page visits: <span className="text-text-primary font-medium">{campaign.results.landingPageVisits}</span></div>
                  )}
                  {campaign.results.enquiriesReceived != null && (
                    <div>Enquiries: <span className="text-text-primary font-medium">{campaign.results.enquiriesReceived}</span></div>
                  )}
                  {campaign.results.costToSend != null && (
                    <div>Cost to send: <span className="text-text-primary font-medium">£{campaign.results.costToSend.toLocaleString('en-GB')}</span></div>
                  )}
                </div>
                {campaign.results.notes && (
                  <p className="text-xs text-text-secondary mt-2 italic">"{campaign.results.notes}"</p>
                )}
              </div>
            )}

            {/* Log results button */}
            {ended && !isLogging && (
              <button
                onClick={() => startLoggingResults(campaign.id, campaign.results)}
                className="btn btn-secondary text-sm mt-4 w-full"
              >
                {campaign.results ? 'Edit results' : 'Log results'}
              </button>
            )}

            {/* Log results form */}
            {isLogging && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-text-secondary">LOG RESULTS</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Email open rate (%)</label>
                    <input
                      type="number"
                      value={resultsForm.emailOpenRate}
                      onChange={(e) => setResultsForm({ ...resultsForm, emailOpenRate: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Email click rate (%)</label>
                    <input
                      type="number"
                      value={resultsForm.emailClickRate}
                      onChange={(e) => setResultsForm({ ...resultsForm, emailClickRate: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Unsubscribes</label>
                    <input
                      type="number"
                      value={resultsForm.unsubscribes}
                      onChange={(e) => setResultsForm({ ...resultsForm, unsubscribes: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Landing page visits</label>
                    <input
                      type="number"
                      value={resultsForm.landingPageVisits}
                      onChange={(e) => setResultsForm({ ...resultsForm, landingPageVisits: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Enquiries received</label>
                    <input
                      type="number"
                      value={resultsForm.enquiriesReceived}
                      onChange={(e) => setResultsForm({ ...resultsForm, enquiriesReceived: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Cost to send (£)</label>
                    <input
                      type="number"
                      value={resultsForm.costToSend}
                      onChange={(e) => setResultsForm({ ...resultsForm, costToSend: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Notes / what worked</label>
                  <textarea
                    value={resultsForm.notes}
                    onChange={(e) => setResultsForm({ ...resultsForm, notes: e.target.value })}
                    className="input text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveResults(campaign.id)} className="btn btn-primary text-sm flex-1">
                    Save results
                  </button>
                  <button
                    onClick={() => {
                      setLoggingCampaignId(null);
                      setResultsForm(EMPTY_RESULTS_FORM);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {ACUMATICA_URL && (
              <a
                href={ACUMATICA_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn btn-secondary text-sm mt-4 w-full flex items-center justify-center gap-2"
              >
                View in Acumatica <ExternalLink size={13} />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Campaigns</h1>
          {isEditor && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              New campaign
            </button>
          )}
        </div>

        {/* Roll-up metrics */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Campaigns</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{metrics.campaigns}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Budget</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{formatCurrency(metrics.budget)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Actual Spend</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{formatCurrency(metrics.spend)}</p>
              <p className="text-xs text-text-secondary mt-1">{metrics.budget > 0 ? Math.round((metrics.spend / metrics.budget) * 100) : 0}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Marketing Leads</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{metrics.leads}</p>
              <p className="text-xs text-text-secondary mt-1 truncate">{formatCurrency(metrics.valueGenerated)} value generated</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border" style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-text-secondary mb-1">Fundable Spend</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary truncate">{formatCurrency(metrics.fundableSpend)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {campaigns.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-8">
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value as Brand | 'all')} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Brands</option>
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
              <option value="idaro">IDARO</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'all')} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Industries</option>
              {getUniqueIndustries().map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="input" style={{ maxWidth: 150 }}>
              <option value="all">All Vendors</option>
              {getUniqueVendors().map((v) => (
                <option key={v} value={v}>
                  {getVendorLabel(v)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          activeCampaigns.length > 0 || completedCampaigns.length > 0 ? (
            <>
              {activeCampaigns.length > 0 && renderCampaignGrid(displayedActiveCampaigns)}

              {hasMoreCampaigns && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setDisplayedCount(displayedCount + 8)}
                    className="btn btn-secondary"
                  >
                    Load more
                  </button>
                </div>
              )}

              {completedCampaigns.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-lg font-semibold text-text-secondary mb-4">
                    Completed ({completedCampaigns.length})
                  </h2>
                  {renderCampaignGrid(completedCampaigns, true)}
                </div>
              )}
            </>
          ) : (
            <p className="text-text-secondary text-center py-12">No campaigns match these filters.</p>
          )
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
          }}
        >
          <div>
            <p className="font-semibold text-text-primary" style={{ margin: '0 0 4px' }}>Acumatica integration</p>
            <p className="text-sm text-text-secondary" style={{ margin: 0 }}>
              Manage detailed campaign codes, budgets, and timelines in Acumatica
            </p>
          </div>
          {ACUMATICA_URL ? (
            <a
              href={ACUMATICA_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary flex items-center gap-2"
              style={{ whiteSpace: 'nowrap' }}
            >
              Open Acumatica <ExternalLink size={14} />
            </a>
          ) : (
            <span className="text-xs text-text-secondary" style={{ whiteSpace: 'nowrap' }}>URL not yet configured</span>
          )}
        </div>
      </div>

      {showAddModal && <AddCampaignModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
