import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Copy, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateShort } from '@/utils/dateUtils';
import { Task, TrackingLink, Brand } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { nanoid } from 'nanoid';
import '@/styles/campaignDetailPanel.css';

type PanelTab = 'overview' | 'schedule' | 'sends' | 'funding' | 'tracking-links';

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
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Overview tab fields
  const [budget, setBudget] = useState(campaign?.budget?.toString() || '');
  const [spend, setSpend] = useState(campaign?.spend?.toString() || '');
  const [valueGenerated, setValueGenerated] = useState(campaign?.valueGenerated?.toString() || '');
  const [leads, setLeads] = useState(campaign?.leads?.toString() || '');

  // Schedule tab fields - notes stays here for Campaign Notes section
  const [notes, setNotes] = useState(campaign?.notes || '');

  // Funding tab fields
  const [vendor, setVendor] = useState(campaign?.vendor || '');
  const [scheme, setScheme] = useState(campaign?.scheme || '');
  const [cofundRate, setCofundRate] = useState(campaign?.cofundRate?.toString() || '');
  const [claimStatus, setClaimStatus] = useState(campaign?.claimStatus || '');

  // Tracking Links tab form state
  const [trackingLinkForm, setTrackingLinkForm] = useState({
    entity: '' as Brand | '',
    name: '',
    channel: '',
    landingPage: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
  });
  const [editingTrackingLink, setEditingTrackingLink] = useState<string | null>(null);

  // Schedule tab fields
  const ensureScheduleIds = (items: any[]) => {
    return items.map((item) => ({
      ...item,
      id: item.id || `schedule-${nanoid(10)}`,
    }));
  };

  const [schedule, setSchedule] = useState(() => ensureScheduleIds(campaign?.schedule || []));

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
      setSchedule(ensureScheduleIds(campaign.schedule || []));
      setTrackingLinkForm({
        entity: '' as Brand | '',
        name: '',
        channel: '',
        landingPage: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
      });
      setEditingTrackingLink(null);
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

  const handleExportSchedule = () => {
    if (!schedule || schedule.length === 0) {
      showToast('No schedule elements to export');
      return;
    }

    // Build CSV
    let csv = 'Campaign,Go Live,Element,Status\n';
    schedule.forEach(({ date, element, status }) => {
      // Escape quotes in element names
      const escapedElement = element.replace(/"/g, '""');
      csv += `"${campaign.name}","${date}","${escapedElement}","${status}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${campaign.name.replace(/\s+/g, '-')}-Schedule-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✓ Schedule exported as CSV');
  };

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
          {(['overview', 'schedule', 'sends', 'funding', 'tracking-links'] as PanelTab[]).map((tab) => (
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
              {tab === 'overview' ? 'Overview' : tab === 'schedule' ? 'Schedule' : tab === 'sends' ? 'Sends' : tab === 'funding' ? 'Funding' : 'Tracking Links'}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Recipients (read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Recipients</label>
              <div className="px-3 py-2 rounded border border-border" style={{ color: '#1e3a8a' }}>
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
              <div className="px-3 py-2 rounded border border-border font-semibold" style={{ color: '#1e3a8a' }}>
                {roi >= 0 ? '+' : ''}{roi}% (calculated, read-only)
              </div>
            </div>
          </div>
        )}

        {/* TAB: Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            {/* Linked Tasks Section - at top */}
            {campaignTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Linked Tasks</h3>
                <div className="space-y-2">
                  {campaignTasks.map((task) => {
                    const color = BRAND_COLOR[task.brand];
                    return (
                      <div
                        key={task.id}
                        className="px-3 py-2 rounded border text-sm"
                        style={{
                          backgroundColor: `${color}10`,
                          borderColor: color,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span style={{ color, fontWeight: 600, minWidth: '60px' }}>
                            {BRAND_LABEL[task.brand]}
                          </span>
                          <div className="flex-1">
                            <div style={{ color: 'var(--text-primary)' }} className="font-medium">
                              {task.title}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {task.deadline && <span>{formatDateShort(task.deadline)}</span>}
                              {task.status && <span>· {task.status}</span>}
                              {task.priority && <span>· {task.priority}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline Table */}
            {schedule.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Campaign Milestones</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--color-border)' }}>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Milestone</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Status</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...schedule].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((item) => {
                        const originalIdx = schedule.findIndex(s => s.id === item.id);
                        const date = new Date(item.date);
                        const displayDate = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                        const statusColors = {
                          planning: '#94a3b8',
                          scheduled: '#3b82f6',
                          live: '#10b981',
                          complete: '#6366f1',
                        };
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td className="px-3 py-3 text-text-primary font-medium">{displayDate}</td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={item.element}
                                onChange={(e) => {
                                  const updated = [...schedule];
                                  updated[originalIdx].element = e.target.value;
                                  setSchedule(updated);
                                }}
                                onBlur={() => {
                                  const withIds = ensureScheduleIds(schedule);
                                  updateCampaign(campaign.id, { schedule: withIds });
                                  showToast('✓ Updated');
                                }}
                                className="input text-sm w-full"
                                placeholder="Milestone"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={item.status}
                                onChange={(e) => {
                                  const updated = [...schedule];
                                  updated[originalIdx].status = e.target.value as any;
                                  setSchedule(updated);
                                }}
                                onBlur={() => {
                                  const withIds = ensureScheduleIds(schedule);
                                  updateCampaign(campaign.id, { schedule: withIds });
                                  showToast('✓ Updated');
                                }}
                                className="input text-sm w-full"
                              >
                                <option value="planning">Planning</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="live">Live</option>
                                <option value="complete">Complete</option>
                              </select>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => {
                                  const updated = schedule.filter((_, i) => i !== originalIdx);
                                  setSchedule(updated);
                                  updateCampaign(campaign.id, { schedule: updated });
                                  showToast('✓ Removed');
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const updated = [...schedule, { id: `schedule-${nanoid(10)}`, date: '', element: '', status: 'planning' as const }];
                      setSchedule(updated);
                    }}
                    className="btn btn-secondary text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add milestone
                  </button>
                  <button
                    onClick={handleExportSchedule}
                    className="btn btn-secondary text-sm"
                  >
                    Export as CSV
                  </button>
                  {campaign?.planDocument && (
                    <button
                      onClick={() => setShowPlanModal(true)}
                      className="btn btn-secondary text-sm flex items-center gap-2"
                    >
                      <FileText size={16} />
                      View Full Plan
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Campaign Notes Section */}
            <div className="border-t pt-8">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Campaign Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">Overview & Strategy</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => {
                      if (notes !== campaign.notes) {
                        updateCampaign(campaign.id, { notes });
                        showToast('✓ Notes saved');
                      }
                    }}
                    className="input w-full text-sm"
                    rows={6}
                    placeholder="Campaign overview, key objectives, wave structure, messaging strategy..."
                  />
                </div>
              </div>
            </div>

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
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Bounces</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Unsubscribes</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Cost (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailSends.map((task, idx) => (
                      <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                        <td className="px-3 py-2 text-text-primary">{task.title}</td>
                        <td className="px-3 py-2 text-text-secondary">{task.deadline ? formatDateShort(task.deadline) : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-primary">{task.recipients ? task.recipients.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{task.openRate != null ? `${task.openRate.toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{task.clickRate != null ? `${task.clickRate.toFixed(1)}%` : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{task.bounces != null ? task.bounces.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{task.unsubscribes != null ? task.unsubscribes.toLocaleString() : '—'}</td>
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
              <div className="px-3 py-2 rounded border border-border" style={{ color: '#1e3a8a' }}>
                £{eligibleSpend.toLocaleString()} (read-only, calculated from budget)
              </div>
            </div>

            {/* Recoverable Amount (calculated, read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Recoverable Amount (£)</label>
              <div className="px-3 py-2 rounded border border-border" style={{ color: '#1e3a8a' }}>
                £{recoverable.toLocaleString()} (read-only, eligible × co-fund %)
              </div>
            </div>
          </div>
        )}

        {/* TAB: Tracking Links */}
        {activeTab === 'tracking-links' && (
          <div className="space-y-8">
            {/* Add/Edit Tracking Link Form */}
            <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                {editingTrackingLink ? 'Edit Tracking Link' : 'Add New Tracking Link'}
              </h3>

              <div className="space-y-4">
                {/* Entity Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Entity</label>
                  <select
                    value={trackingLinkForm.entity}
                    onChange={(e) => {
                      setTrackingLinkForm({
                        ...trackingLinkForm,
                        entity: e.target.value as Brand,
                      });
                    }}
                    className="input w-full"
                  >
                    <option value="">Select entity</option>
                    {campaign.entities?.map((entity) => (
                      <option key={entity} value={entity}>
                        {BRAND_LABEL[entity]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Link Name</label>
                  <input
                    type="text"
                    value={trackingLinkForm.name}
                    onChange={(e) => {
                      setTrackingLinkForm({
                        ...trackingLinkForm,
                        name: e.target.value,
                      });
                    }}
                    className="input w-full"
                    placeholder="e.g., Homepage Hero CTA"
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Channel</label>
                  <input
                    type="text"
                    value={trackingLinkForm.channel}
                    onChange={(e) => {
                      setTrackingLinkForm({
                        ...trackingLinkForm,
                        channel: e.target.value,
                      });
                    }}
                    className="input w-full"
                    placeholder="e.g., email, social, display"
                  />
                </div>

                {/* Landing Page */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Landing Page URL</label>
                  <input
                    type="text"
                    value={trackingLinkForm.landingPage}
                    onChange={(e) => {
                      setTrackingLinkForm({
                        ...trackingLinkForm,
                        landingPage: e.target.value,
                      });
                    }}
                    className="input w-full"
                    placeholder="e.g., https://example.com/products"
                  />
                </div>

                {/* UTM Parameters */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-semibold text-text-secondary">UTM Parameters</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Source</label>
                      <input
                        type="text"
                        value={trackingLinkForm.utmSource}
                        onChange={(e) => {
                          setTrackingLinkForm({
                            ...trackingLinkForm,
                            utmSource: e.target.value,
                          });
                        }}
                        className="input w-full"
                        placeholder="e.g., google, linkedin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Medium</label>
                      <input
                        type="text"
                        value={trackingLinkForm.utmMedium}
                        onChange={(e) => {
                          setTrackingLinkForm({
                            ...trackingLinkForm,
                            utmMedium: e.target.value,
                          });
                        }}
                        className="input w-full"
                        placeholder="e.g., cpc, email, organic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Campaign</label>
                      <input
                        type="text"
                        value={trackingLinkForm.utmCampaign}
                        onChange={(e) => {
                          setTrackingLinkForm({
                            ...trackingLinkForm,
                            utmCampaign: e.target.value,
                          });
                        }}
                        className="input w-full"
                        placeholder="Campaign name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Content (optional)</label>
                      <input
                        type="text"
                        value={trackingLinkForm.utmContent}
                        onChange={(e) => {
                          setTrackingLinkForm({
                            ...trackingLinkForm,
                            utmContent: e.target.value,
                          });
                        }}
                        className="input w-full"
                        placeholder="Ad variant or content ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      if (!trackingLinkForm.entity || !trackingLinkForm.name || !trackingLinkForm.landingPage) {
                        showToast('Entity, Link Name, and Landing Page are required');
                        return;
                      }

                      const newTrackingLink: TrackingLink = {
                        id: editingTrackingLink || `tracking-${nanoid(10)}`,
                        entity: trackingLinkForm.entity as Brand,
                        name: trackingLinkForm.name,
                        channel: trackingLinkForm.channel,
                        landingPage: trackingLinkForm.landingPage,
                        utmSource: trackingLinkForm.utmSource,
                        utmMedium: trackingLinkForm.utmMedium,
                        utmCampaign: trackingLinkForm.utmCampaign,
                        utmContent: trackingLinkForm.utmContent || undefined,
                      };

                      const existingLinks = campaign.trackingLinks || [];
                      let updatedLinks: TrackingLink[];

                      if (editingTrackingLink) {
                        updatedLinks = existingLinks.map((link) =>
                          link.id === editingTrackingLink ? newTrackingLink : link
                        );
                      } else {
                        updatedLinks = [...existingLinks, newTrackingLink];
                      }

                      updateCampaign(campaign.id, { trackingLinks: updatedLinks });
                      setTrackingLinkForm({
                        entity: '' as Brand | '',
                        name: '',
                        channel: '',
                        landingPage: '',
                        utmSource: '',
                        utmMedium: '',
                        utmCampaign: '',
                        utmContent: '',
                      });
                      setEditingTrackingLink(null);
                      showToast(editingTrackingLink ? '✓ Tracking link updated' : '✓ Tracking link added');
                    }}
                    className="btn btn-primary flex-1"
                  >
                    {editingTrackingLink ? 'Update Link' : 'Add Link'}
                  </button>
                  {editingTrackingLink && (
                    <button
                      onClick={() => {
                        setTrackingLinkForm({
                          entity: '' as Brand | '',
                          name: '',
                          channel: '',
                          landingPage: '',
                          utmSource: '',
                          utmMedium: '',
                          utmCampaign: '',
                          utmContent: '',
                        });
                        setEditingTrackingLink(null);
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Full Link Preview */}
            {trackingLinkForm.landingPage && trackingLinkForm.utmSource && trackingLinkForm.utmMedium && trackingLinkForm.utmCampaign && (
              <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Full Link Preview</h3>
                <div className="space-y-3">
                  {(() => {
                    const params = new URLSearchParams({
                      utm_source: trackingLinkForm.utmSource,
                      utm_medium: trackingLinkForm.utmMedium,
                      utm_campaign: trackingLinkForm.utmCampaign,
                      ...(trackingLinkForm.utmContent && { utm_content: trackingLinkForm.utmContent }),
                    });
                    const fullUrl = `${trackingLinkForm.landingPage}${trackingLinkForm.landingPage.includes('?') ? '&' : '?'}${params.toString()}`;
                    return (
                      <>
                        <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', wordBreak: 'break-all' }}>
                          <p className="text-xs font-mono text-text-primary">{fullUrl}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(fullUrl);
                            showToast('✓ Copied to clipboard');
                          }}
                          className="btn btn-secondary w-full flex items-center justify-center gap-2"
                        >
                          <Copy size={14} />
                          Copy Full URL
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tracking Links Table */}
            {(campaign.trackingLinks || []).length > 0 ? (
              <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold text-text-primary mb-4">All Tracking Links</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--color-border)' }}>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Entity</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Channel</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Landing Page</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.trackingLinks?.map((link, idx) => (
                        <tr key={link.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                          <td className="px-3 py-3">
                            <span style={{ color: BRAND_COLOR[link.entity], fontWeight: 600 }}>
                              {BRAND_LABEL[link.entity]}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-text-primary font-medium">{link.name}</td>
                          <td className="px-3 py-3 text-text-secondary">{link.channel}</td>
                          <td className="px-3 py-3 text-text-secondary text-xs" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.landingPage}</td>
                          <td className="px-3 py-3 text-center flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setTrackingLinkForm({
                                  entity: link.entity,
                                  name: link.name,
                                  channel: link.channel,
                                  landingPage: link.landingPage,
                                  utmSource: link.utmSource,
                                  utmMedium: link.utmMedium,
                                  utmCampaign: link.utmCampaign,
                                  utmContent: link.utmContent || '',
                                });
                                setEditingTrackingLink(link.id);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const updated = (campaign.trackingLinks || []).filter((l) => l.id !== link.id);
                                updateCampaign(campaign.id, { trackingLinks: updated });
                                showToast('✓ Tracking link deleted');
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <p className="text-sm">No tracking links yet. Add your first one above.</p>
              </div>
            )}
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

      {/* Plan Modal */}
      {showPlanModal && campaign?.planDocument && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPlanModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '2rem',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">{campaign.name} — Master Plan</h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            <div className="text-sm text-text-secondary mb-4">
              {campaign.planDocument.filename}
            </div>
            <div
              className="prose prose-invert max-w-none"
              style={{ color: 'var(--text-primary)' }}
            >
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit' }}>
                {campaign.planDocument.content}
              </pre>
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
