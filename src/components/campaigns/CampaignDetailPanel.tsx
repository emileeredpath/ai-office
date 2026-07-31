import { useState, useEffect } from 'react';
import { X, MoreVertical, ArrowUpDown, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';
import { Brand, Task } from '@/types/index';
import { PlanTab } from '@/components/campaigns/PlanTab';
import '@/styles/campaignDetailPanel.css';

type SortKey = 'date' | 'cost' | 'recipients';
type PanelTab = 'overview' | 'plan';

const ENTITY_OPTIONS: { value: Brand; label: string }[] = [
  { value: 'mtech', label: 'MTech Group' },
  { value: 'brentwood', label: 'Brentwood Communications' },
  { value: 'radio-links', label: 'Radio Links' },
  { value: 'capcom', label: 'Capcom' },
  { value: 'ircl', label: 'IRCL' },
  { value: 'idaro', label: 'IDARO' },
];

export function CampaignDetailPanel() {
  const selectedCampaignId = useAppStore((s) => s.selectedCampaignId);
  const campaign = useAppStore((s) =>
    s.selectedCampaignId ? s.campaigns.find((c) => c.id === s.selectedCampaignId) ?? null : null
  );
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const selectTask = useAppStore((s) => s.selectTask);
  const tasks = useAppStore((s) => s.tasks);

  const campaignTasks = campaign ? tasks.filter((t) => t.campaignId === campaign.id) : [];
  const unlinkedTasks = tasks.filter((t) => !t.campaignId);

  const [notes, setNotes] = useState(campaign?.notes || '');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [selectedUnlinkedIds, setSelectedUnlinkedIds] = useState<Set<string>>(new Set());
  const [isLinking, setIsLinking] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setNotes(campaign?.notes || '');
    setActiveTab('overview');
  }, [selectedCampaignId]);

  if (!campaign) return null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortValue = (t: Task, key: SortKey): number => {
    if (key === 'date') return t.deadline ? new Date(t.deadline).getTime() : 0;
    if (key === 'cost') return t.cost ?? 0;
    return t.recipients ?? 0;
  };

  const sortedSends = [...campaignTasks].sort((a, b) => {
    const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
    return sortDir === 'asc' ? diff : -diff;
  });

  // Financial/reach totals — sum only tasks that actually carry the field,
  // so a campaign with a mix of costed and uncosted sends doesn't understate.
  const sendTasks = campaignTasks.filter((t) => t.type === 'email-send');
  const totalRecipients = sendTasks.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const totalTaskCost = campaignTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const spendPerRecipient = totalRecipients > 0 && campaign.spend > 0 ? campaign.spend / totalRecipients : null;
  const sendDates = sendTasks
    .filter((t) => t.deadline)
    .map((t) => new Date(t.deadline as Date).getTime())
    .sort((a, b) => a - b);
  const dateRange =
    sendDates.length > 0
      ? { first: new Date(sendDates[0]), last: new Date(sendDates[sendDates.length - 1]) }
      : null;
  const costChartData = sendTasks
    .filter((t) => t.cost != null)
    .map((t) => ({ name: t.title.length > 18 ? `${t.title.slice(0, 16)}…` : t.title, cost: t.cost || 0 }));

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    setTimeout(() => {
      updateCampaign(campaign.id, { notes: newNotes });
    }, 500);
  };

  const handleToggleUnlinkedTask = (taskId: string) => {
    setSelectedUnlinkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleLinkSelectedTasks = async () => {
    if (selectedUnlinkedIds.size === 0) return;
    setIsLinking(true);
    try {
      for (const taskId of selectedUnlinkedIds) {
        await updateTask(taskId, { campaignId: campaign.id });
      }
      setSelectedUnlinkedIds(new Set());
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    setShowMoreMenu(false);
    await deleteCampaign(campaign.id);
    selectCampaign(null);
  };

  const completedTasks = campaignTasks.filter((t) => t.status === 'complete').length;
  const progress = campaignTasks.length > 0 ? Math.round((completedTasks / campaignTasks.length) * 100) : 0;

  return (
    <div className="campaign-detail-panel">
      {/* Header */}
      <div className="campaign-detail-header">
        <button className="btn-close" onClick={() => selectCampaign(null)}>
          <X size={20} />
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="btn-more"
            onClick={() => setShowMoreMenu((v) => !v)}
            style={{ position: 'relative' }}
          >
            <MoreVertical size={20} />
          </button>
          {showMoreMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '4px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                zIndex: 10,
                minWidth: '160px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <button
                onClick={handleDeleteCampaign}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#ff4444',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Delete campaign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="campaign-detail-content">
        {/* Title */}
        <h1 className="campaign-detail-title">{campaign.name}</h1>

        {/* Tabs */}
        <div className="flex gap-1" style={{ marginBottom: '1.5rem', marginTop: '-0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          {(['overview', 'plan'] as PanelTab[]).map((tab) => (
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
              {tab === 'plan' ? 'Plan' : 'Overview'}
            </button>
          ))}
        </div>

        {activeTab === 'plan' ? (
          <PlanTab campaign={campaign} campaignTasks={campaignTasks} onSelectTask={selectTask} />
        ) : (
        <>
        {/* Field Row 1 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Brand</label>
            <div className="flex items-center gap-2">
              <BrandBadge brand={campaign.brand} />
            </div>
          </div>

          <div className="campaign-detail-field">
            <label>Status</label>
            <select
              value={campaign.status}
              onChange={(e) => updateCampaign(campaign.id, { status: e.target.value as any })}
              className="input"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="campaign-detail-field">
            <label>Actual spend (£)</label>
            <input
              type="number"
              value={campaign.spend || ''}
              placeholder="Not set"
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  spend: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="input"
            />
          </div>

          <div className="campaign-detail-field">
            <label>Budget (£)</label>
            <input
              type="number"
              value={campaign.budget ?? ''}
              placeholder="Not set"
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  budget: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Financial summary — spend/budget already shown in the editable
            field above; this only adds numbers not shown anywhere else. */}
        {(spendPerRecipient != null || totalRecipients > 0) && (
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
              flexWrap: 'wrap',
            }}
          >
            {spendPerRecipient != null && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Cost per recipient
                </p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  £{spendPerRecipient.toFixed(3)}
                </p>
              </div>
            )}
            {totalRecipients > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Total recipients
                </p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {totalRecipients.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sends from — multi-entity */}
        <div className="campaign-detail-field mb-4">
          <label>Sends from</label>
          <div className="flex flex-wrap gap-3 mt-1">
            {ENTITY_OPTIONS.map((entity) => {
              const checked = (campaign.entities || [campaign.brand]).includes(entity.value);
              return (
                <label key={entity.value} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = campaign.entities || [campaign.brand];
                      const next = e.target.checked
                        ? [...current, entity.value]
                        : current.filter((b) => b !== entity.value);
                      updateCampaign(campaign.id, { entities: next.length > 0 ? next : [entity.value] });
                    }}
                  />
                  {entity.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Metrics Row 1 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Leads</label>
            <input
              type="number"
              value={campaign.leads}
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  leads: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="input"
            />
          </div>

          <div className="campaign-detail-field">
            <label>Conversions</label>
            <input
              type="number"
              value={campaign.conversions}
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  conversions: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Metrics Row 2 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Engagement (%)</label>
            <input
              type="number"
              step="0.1"
              value={campaign.engagement}
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  engagement: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="campaign-detail-divider"></div>

        {/* Field Row 2 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Start date</label>
            <input
              type="date"
              value={
                campaign.startDate
                  ? campaign.startDate instanceof Date
                    ? campaign.startDate.toISOString().split('T')[0]
                    : String(campaign.startDate).split('T')[0]
                  : ''
              }
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  startDate: e.target.value ? new Date(e.target.value) : new Date(),
                })
              }
              className="input"
            />
          </div>

          <div className="campaign-detail-field">
            <label>End date</label>
            <input
              type="date"
              value={
                campaign.endDate
                  ? campaign.endDate instanceof Date
                    ? campaign.endDate.toISOString().split('T')[0]
                    : String(campaign.endDate).split('T')[0]
                  : ''
              }
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  endDate: e.target.value ? new Date(e.target.value) : new Date(),
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Field Row 3 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Primary industry</label>
            <input
              type="text"
              value={campaign.primaryIndustry}
              onChange={(e) =>
                updateCampaign(campaign.id, { primaryIndustry: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="campaign-detail-field">
            <label>Secondary industry</label>
            <input
              type="text"
              value={campaign.secondaryIndustry}
              onChange={(e) =>
                updateCampaign(campaign.id, { secondaryIndustry: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="campaign-detail-field">
            <label>Theme</label>
            <input
              type="text"
              value={campaign.theme}
              onChange={(e) =>
                updateCampaign(campaign.id, { theme: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="campaign-detail-divider"></div>

        {/* Progress */}
        <div>
          <h3 className="campaign-detail-section-title">PROGRESS</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="bg-accent h-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-text-primary">{progress}%</span>
          </div>
          <p className="text-sm text-text-secondary">
            {completedTasks} of {campaignTasks.length} tasks complete
          </p>
        </div>

        {/* Divider */}
        <div className="campaign-detail-divider"></div>

        {/* Linked Tasks / sends breakdown */}
        <div>
          <h3 className="campaign-detail-section-title">SENDS &amp; TASKS</h3>
          {campaignTasks.length > 0 ? (
            <>
              <p className="text-xs text-text-secondary mb-3">
                {sendTasks.length} send{sendTasks.length === 1 ? '' : 's'}
                {totalRecipients > 0 && ` · ${totalRecipients.toLocaleString()} recipients`}
                {totalTaskCost > 0 && ` · £${totalTaskCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                {dateRange && ` · ${formatDateShort(dateRange.first)} – ${formatDateShort(dateRange.last)}`}
              </p>

              {costChartData.length > 1 && (
                <div style={{ height: 24 * costChartData.length + 20, marginBottom: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costChartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                      />
                      <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Cost']} />
                      <Bar dataKey="cost" fill="#3B82F6" radius={3} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Send</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                        <span className="inline-flex items-center gap-1">Date <ArrowUpDown size={11} /></span>
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => toggleSort('recipients')}>
                        <span className="inline-flex items-center gap-1">Recipients <ArrowUpDown size={11} /></span>
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => toggleSort('cost')}>
                        <span className="inline-flex items-center gap-1">Cost <ArrowUpDown size={11} /></span>
                      </th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSends.map((task) => (
                      <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <div className="flex items-center gap-1.5">
                            <BrandBadge brand={task.brand} />
                            <span className="text-text-primary">{task.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}>
                          {task.deadline ? formatDateShort(task.deadline) : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                          {task.recipients != null ? task.recipients.toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                          {task.cost != null ? `£${task.cost.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}>{task.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-secondary">No tasks linked to this campaign</p>
          )}
        </div>

        {/* Divider */}
        <div className="campaign-detail-divider"></div>

        {/* Link Unlinked Tasks */}
        {unlinkedTasks.length > 0 && (
          <div>
            <h3 className="campaign-detail-section-title">LINK TASKS TO CAMPAIGN</h3>
            <p className="text-xs text-text-secondary mb-3">
              {unlinkedTasks.length} unlinked task{unlinkedTasks.length === 1 ? '' : 's'} in the system
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <div style={{ paddingTop: 0 }}>
                {unlinkedTasks.map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      backgroundColor: selectedUnlinkedIds.has(task.id) ? 'var(--color-surface)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnlinkedIds.has(task.id)}
                      onChange={() => handleToggleUnlinkedTask(task.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {task.deadline ? formatDateShort(task.deadline) : 'No deadline'} · {task.status}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {task.priority}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {selectedUnlinkedIds.size > 0 && (
              <button
                onClick={handleLinkSelectedTasks}
                disabled={isLinking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLinking ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: isLinking ? 0.6 : 1,
                }}
              >
                <Check size={14} />
                Link {selectedUnlinkedIds.size} task{selectedUnlinkedIds.size === 1 ? '' : 's'} to campaign
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="campaign-detail-divider"></div>

        {/* Meeting Notes */}
        <div>
          <h3 className="campaign-detail-section-title">MEETING NOTES</h3>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add meeting notes, key decisions, or action items..."
            className="campaign-detail-textarea"
          />
        </div>
        </>
        )}
      </div>
    </div>
  );
}
