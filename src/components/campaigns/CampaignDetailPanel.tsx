import { useState, useEffect } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import '@/styles/campaignDetailPanel.css';

export function CampaignDetailPanel() {
  const selectedCampaignId = useAppStore((s) => s.selectedCampaignId);
  const getCampaignById = useAppStore((s) => s.getCampaignById);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const tasks = useAppStore((s) => s.tasks);

  const campaign = selectedCampaignId ? getCampaignById(selectedCampaignId) : null;

  useEffect(() => {
    console.log('CampaignDetailPanel - selectedCampaignId:', selectedCampaignId);
    console.log('CampaignDetailPanel - campaign:', campaign);
  }, [selectedCampaignId, campaign]);

  const campaignTasks = campaign ? tasks.filter((t) => t.campaignId === campaign.id) : [];

  const [notes, setNotes] = useState(campaign?.notes || '');

  useEffect(() => {
    if (campaign) {
      setNotes(campaign.notes || '');
    }
  }, [selectedCampaignId, campaign]);

  if (!campaign) {
    console.log('CampaignDetailPanel - no campaign found');
    return null;
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    setTimeout(() => {
      updateCampaign(campaign.id, { notes: newNotes });
    }, 500);
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
        <button className="btn-more">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="campaign-detail-content">
        {/* Title */}
        <h1 className="campaign-detail-title">{campaign.name}</h1>

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
            <label>Budget (£)</label>
            <input
              type="number"
              value={campaign.budget || ''}
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  budget: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Metrics Row 1 */}
        <div className="campaign-detail-fields">
          <div className="campaign-detail-field">
            <label>Spend (£)</label>
            <input
              type="number"
              value={campaign.spend}
              onChange={(e) =>
                updateCampaign(campaign.id, {
                  spend: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="input"
            />
          </div>

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

        {/* Linked Tasks */}
        <div>
          <h3 className="campaign-detail-section-title">LINKED TASKS</h3>
          {campaignTasks.length > 0 ? (
            <div className="space-y-2">
              {campaignTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-surface rounded">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{task.title}</p>
                    <p className="text-xs text-text-secondary">{task.brand} • {task.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No tasks linked to this campaign</p>
          )}
        </div>

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
      </div>
    </div>
  );
}
