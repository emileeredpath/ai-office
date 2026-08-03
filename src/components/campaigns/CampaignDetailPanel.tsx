import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateShort } from '@/utils/dateUtils';
import { Task } from '@/types/index';
import '@/styles/campaignDetailPanel.css';

type PanelTab = 'overview' | 'schedule' | 'sends' | 'funding';

interface ConfirmModal {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  onConfirm: () => void;
}

interface Toast {
  message: string;
  id: number;
}

export function CampaignDetailPanel() {
  const selectedCampaignId = useAppStore((s) => s.selectedCampaignId);
  const campaign = useAppStore((s) =>
    s.selectedCampaignId ? s.campaigns.find((c) => c.id === s.selectedCampaignId) ?? null : null
  );
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const tasks = useAppStore((s) => s.tasks);

  const campaignTasks = campaign ? tasks.filter((t) => t.campaignId === campaign.id) : [];
  const emailSends = campaignTasks.filter((t) => t.type === 'email-send');

  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // Overview tab fields
  const [budget, setBudget] = useState(campaign?.budget?.toString() || '');
  const [spend, setSpend] = useState(campaign?.spend?.toString() || '');
  const [valueGenerated, setValueGenerated] = useState(campaign?.valueGenerated?.toString() || '');
  const [leads, setLeads] = useState(campaign?.leads?.toString() || '');
  const [notes, setNotes] = useState(campaign?.notes || '');

  // Funding tab fields
  const [vendor, setVendor] = useState(campaign?.vendor || '');
  const [scheme, setScheme] = useState(campaign?.scheme || '');
  const [cofundRate, setCofundRate] = useState(campaign?.cofundRate?.toString() || '');
  const [claimStatus, setClaimStatus] = useState(campaign?.claimStatus || '');

  // Schedule tab fields
  const [schedule, setSchedule] = useState(campaign?.schedule || []);

  useEffect(() => {
    if (campaign) {
      setBudget(campaign.budget?.toString() || '');
      setSpend(campaign.spend?.toString() || '');
      setValueGenerated(campaign.valueGenerated?.toString() || '');
      setLeads(campaign.leads?.toString() || '');
      setNotes(campaign.notes || '');
      setVendor(campaign.vendor || '');
      setScheme(campaign.scheme || '');
      setCofundRate(campaign.cofundRate?.toString() || '');
      setClaimStatus(campaign.claimStatus || '');
      setSchedule(campaign.schedule || []);
      setActiveTab('overview');
    }
  }, [selectedCampaignId]);

  // Sync local state when campaign data changes (after updateCampaign)
  useEffect(() => {
    if (campaign) {
      setBudget(campaign.budget?.toString() || '');
      setSpend(campaign.spend?.toString() || '');
      setValueGenerated(campaign.valueGenerated?.toString() || '');
      setLeads(campaign.leads?.toString() || '');
      setNotes(campaign.notes || '');
      setVendor(campaign.vendor || '');
      setScheme(campaign.scheme || '');
      setCofundRate(campaign.cofundRate?.toString() || '');
      setClaimStatus(campaign.claimStatus || '');
      setSchedule(campaign.schedule || []);
    }
  }, [campaign?.budget, campaign?.spend, campaign?.valueGenerated, campaign?.leads, campaign?.notes, campaign?.vendor, campaign?.scheme, campaign?.cofundRate, campaign?.claimStatus, campaign?.id]);

  if (!campaign) return null;

  const showToast = (message: string) => {
    const id = toastIdCounter;
    setToastIdCounter(id + 1);
    setToasts((prev) => [...prev, { message, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const showConfirm = (field: string, oldValue: any, newValue: any, onConfirm: () => void) => {
    setConfirmModal({
      field,
      oldValue: String(oldValue || ''),
      newValue: String(newValue || ''),
      onConfirm,
    });
  };

  const handleFieldChange = (fieldName: string, oldValue: any, newValue: any, onSave: () => void) => {
    if (String(oldValue || '') === String(newValue || '')) return;
    showConfirm(fieldName, oldValue, newValue, () => {
      onSave();
      showToast(`✓ ${fieldName} saved`);
    });
  };

  const roi = campaign.spend > 0 && campaign.valueGenerated ?
    Math.round(((campaign.valueGenerated - campaign.spend) / campaign.spend) * 100) : 0;

  const recipients = campaign.recipients || emailSends.reduce((sum, t) => sum + (t.recipients || 0), 0);

  // Funding calculations
  const eligibleSpend = campaign.budget || 0;
  const recoverable = campaign.cofundRate != null && campaign.budget
    ? Math.round((campaign.budget * campaign.cofundRate) / 100)
    : 0;

  return (
    <div className="campaign-detail-panel">
      {/* Header */}
      <div className="campaign-detail-header">
        <button className="btn-close" onClick={() => selectCampaign(null)}>
          <X size={20} />
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) {
              deleteCampaign(campaign.id);
              selectCampaign(null);
            }
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Delete this campaign"
        >
          Delete
        </button>
      </div>

      {/* Content */}
      <div className="campaign-detail-content">
        <h1 className="campaign-detail-title">{campaign.name}</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['overview', 'schedule', 'sends', 'funding'] as PanelTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-sm font-medium"
              style={{
                padding: '0.5rem 0.25rem',
                marginRight: '1.25rem',
                textTransform: 'capitalize',
                color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              {tab === 'overview' ? 'Overview' : tab === 'schedule' ? 'Schedule' : tab === 'sends' ? 'Sends' : 'Funding'}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Recipients (read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Recipients</label>
              <div className="px-3 py-2 bg-surface rounded border border-border text-text-primary">
                {recipients.toLocaleString()} (read-only)
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Budget (£)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onBlur={() => {
                  const newValue = budget ? Number(budget) : null;
                  handleFieldChange('Budget', campaign.budget, newValue, () => {
                    updateCampaign(campaign.id, { budget: newValue });
                  });
                }}
                className="input w-full"
                placeholder="Not set"
              />
            </div>

            {/* Actual Spend */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Actual Spend (£)</label>
              <input
                type="number"
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                onBlur={() => {
                  const newValue = spend ? Number(spend) : 0;
                  handleFieldChange('Actual Spend', campaign.spend, newValue, () => {
                    updateCampaign(campaign.id, { spend: newValue });
                  });
                }}
                className="input w-full"
                placeholder="0"
              />
            </div>

            {/* Value Generated */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Value Generated (£)</label>
              <input
                type="number"
                value={valueGenerated}
                onChange={(e) => setValueGenerated(e.target.value)}
                onBlur={() => {
                  const newValue = valueGenerated ? Number(valueGenerated) : null;
                  handleFieldChange('Value Generated', campaign.valueGenerated, newValue, () => {
                    updateCampaign(campaign.id, { valueGenerated: newValue });
                  });
                }}
                className="input w-full"
                placeholder="Not set"
              />
            </div>

            {/* Leads */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Leads</label>
              <input
                type="number"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
                onBlur={() => {
                  const newValue = leads ? Number(leads) : 0;
                  handleFieldChange('Leads', campaign.leads, newValue, () => {
                    updateCampaign(campaign.id, { leads: newValue });
                  });
                }}
                className="input w-full"
                placeholder="0"
              />
            </div>

            {/* ROI (calculated, read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">ROI</label>
              <div className="px-3 py-2 bg-surface rounded border border-border text-text-primary font-semibold">
                {roi >= 0 ? '+' : ''}{roi}% (calculated, read-only)
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (notes !== campaign.notes) {
                    updateCampaign(campaign.id, { notes });
                    showToast('✓ Notes saved');
                  }
                }}
                className="input w-full"
                rows={4}
                placeholder="Add any notes..."
              />
            </div>
          </div>
        )}

        {/* TAB: Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--color-border)' }}>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Element</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Status</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => {
                            const updated = [...schedule];
                            updated[idx].date = e.target.value;
                            setSchedule(updated);
                          }}
                          onBlur={() => {
                            updateCampaign(campaign.id, { schedule });
                            showToast('✓ Schedule updated');
                          }}
                          className="input text-sm"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.element}
                          onChange={(e) => {
                            const updated = [...schedule];
                            updated[idx].element = e.target.value;
                            setSchedule(updated);
                          }}
                          onBlur={() => {
                            updateCampaign(campaign.id, { schedule });
                            showToast('✓ Schedule updated');
                          }}
                          className="input text-sm"
                          style={{ width: '100%' }}
                          placeholder="Element name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const updated = [...schedule];
                            updated[idx].status = e.target.value as any;
                            setSchedule(updated);
                          }}
                          onBlur={() => {
                            updateCampaign(campaign.id, { schedule });
                            showToast('✓ Schedule updated');
                          }}
                          className="input text-sm"
                          style={{ width: '100%' }}
                        >
                          <option value="planning">Planning</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="complete">Complete</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            const updated = schedule.filter((_, i) => i !== idx);
                            setSchedule(updated);
                            updateCampaign(campaign.id, { schedule: updated });
                            showToast('✓ Element removed');
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => {
                const updated = [...schedule, { date: '', element: '', status: 'planning' as const }];
                setSchedule(updated);
              }}
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add element
            </button>
          </div>
        )}

        {/* TAB: Sends */}
        {activeTab === 'sends' && (
          <div className="space-y-4">
            {emailSends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--color-border)' }}>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Send Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">Date</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Recipients</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Open %</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Click %</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Cost (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailSends.map((task, idx) => (
                      <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                        <td className="px-3 py-2 text-text-primary">{task.title}</td>
                        <td className="px-3 py-2 text-text-secondary">{task.deadline ? formatDateShort(task.deadline) : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-primary">{task.recipients ? task.recipients.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{campaign.results?.emailOpenRate != null ? `${campaign.results.emailOpenRate.toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{campaign.results?.emailClickRate != null ? `${campaign.results.emailClickRate.toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-primary">{task.cost != null ? `£${task.cost.toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">No email sends synced yet. Campaign Monitor will auto-sync when sends are completed.</p>
            )}
          </div>
        )}

        {/* TAB: Funding */}
        {activeTab === 'funding' && (
          <div className="space-y-4">
            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Vendor</label>
              <select
                value={vendor}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleFieldChange('Vendor', campaign.vendor, newValue, () => {
                    updateCampaign(campaign.id, { vendor: (newValue || null) as any });
                    setVendor(newValue);
                  });
                }}
                className="input w-full"
              >
                <option value="">None</option>
                <option value="motorola">Motorola</option>
                <option value="hytera">Hytera</option>
                <option value="airsys">Airsys</option>
                <option value="telox">Telox</option>
              </select>
            </div>

            {/* Scheme */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Scheme</label>
              <input
                type="text"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                onBlur={() => {
                  if (scheme !== campaign.scheme) {
                    updateCampaign(campaign.id, { scheme });
                    showToast('✓ Scheme saved');
                  }
                }}
                className="input w-full"
                placeholder="e.g. XEVA Marketing Funds"
              />
            </div>

            {/* Co-fund % */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Co-fund % (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={cofundRate}
                onChange={(e) => setCofundRate(e.target.value)}
                onBlur={() => {
                  const newValue = cofundRate ? Number(cofundRate) : null;
                  handleFieldChange('Co-fund %', campaign.cofundRate, newValue, () => {
                    updateCampaign(campaign.id, { cofundRate: newValue });
                  });
                }}
                className="input w-full"
                placeholder="0"
              />
            </div>

            {/* Claim Status */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Claim Status</label>
              <select
                value={claimStatus}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleFieldChange('Claim Status', campaign.claimStatus, newValue, () => {
                    updateCampaign(campaign.id, { claimStatus: (newValue || null) as any });
                    setClaimStatus(newValue);
                  });
                }}
                className="input w-full"
              >
                <option value="">Not set</option>
                <option value="eligible">Eligible</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Eligible Spend (calculated, read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Eligible Spend (£)</label>
              <div className="px-3 py-2 bg-surface rounded border border-border text-text-primary">
                £{eligibleSpend.toLocaleString()} (read-only, calculated from budget)
              </div>
            </div>

            {/* Recoverable Amount (calculated, read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Recoverable Amount (£)</label>
              <div className="px-3 py-2 bg-surface rounded border border-border text-text-primary">
                £{recoverable.toLocaleString()} (read-only, eligible × co-fund %)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              minWidth: '300px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-text-primary font-semibold mb-3">Confirm change?</p>
            <p className="text-sm text-text-secondary mb-4">
              {confirmModal.field}: {confirmModal.oldValue || '(empty)'} → {confirmModal.newValue || '(empty)'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="btn btn-primary flex-1"
              >
                Confirm & save
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              minWidth: '200px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
