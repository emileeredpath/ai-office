import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';
import { CampaignResults } from '@/types/index';
import { AddCampaignModal } from '@/components/campaigns/AddCampaignModal';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_RESULTS_FORM = {
  emailOpenRate: '',
  emailClickRate: '',
  unsubscribes: '',
  landingPageVisits: '',
  enquiriesReceived: '',
  costToSend: '',
  notes: '',
};

export function CampaignsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const { isEditor } = useAuth();

  const [loggingCampaignId, setLoggingCampaignId] = useState<string | null>(null);
  const [resultsForm, setResultsForm] = useState(EMPTY_RESULTS_FORM);
  const [showAddModal, setShowAddModal] = useState(false);

  const getCampaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter((t) => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return 0;
    const completed = campaignTasks.filter((t) => t.status === 'complete').length;
    return Math.round((completed / campaignTasks.length) * 100);
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const isCampaignEnded = (endDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(endDate) < today;
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

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Campaigns</h1>
          {isEditor && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              New campaign
            </button>
          )}
        </div>

        {/* Campaign Grid */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = getCampaignProgress(campaign.id);
              const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);
              const ended = isCampaignEnded(campaign.endDate);
              const isLogging = loggingCampaignId === campaign.id;

              return (
                <div key={campaign.id} className="card hover:shadow-lg transition-shadow">
                  <div
                    className="cursor-pointer"
                    onClick={() => selectCampaign(campaign.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
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

                    <div className="text-sm text-text-secondary">
                      {campaignTasks.filter((t) => t.status === 'complete').length} of{' '}
                      {campaignTasks.length} tasks complete
                    </div>
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
                        <button
                          onClick={() => saveResults(campaign.id)}
                          className="btn btn-primary text-sm flex-1"
                        >
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
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-12">No campaigns yet. Create one to get started.</p>
        )}
      </div>

      {showAddModal && <AddCampaignModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
