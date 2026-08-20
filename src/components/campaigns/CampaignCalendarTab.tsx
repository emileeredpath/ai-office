import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Campaign, Task } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { formatDateShort } from '@/utils/dateUtils';

interface CampaignCalendarTabProps {
  campaign: Campaign;
  campaignTasks: Task[];
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  showToast: (message: string) => void;
  onViewPlan: () => void;
}

const ensureScheduleIds = (items: any[]) =>
  items.map((item) => ({ ...item, id: item.id || `schedule-${nanoid(10)}` }));

const STATUS_COLORS: Record<string, string> = {
  planning: '#94a3b8',
  scheduled: '#3b82f6',
  live: '#10b981',
  complete: '#6366f1',
};

// This is the Campaign Milestones tool moved from the old "Schedule" tab.
// Unlike the campaign-record fields (now behind Edit Campaign), a marketer
// actively works in this calendar day-to-day — it stays directly editable
// here rather than moving behind an edit action.
export function CampaignCalendarTab({ campaign, campaignTasks, updateCampaign, showToast, onViewPlan }: CampaignCalendarTabProps) {
  const [schedule, setSchedule] = useState(() => ensureScheduleIds(campaign.schedule || []));

  useEffect(() => {
    setSchedule(ensureScheduleIds(campaign.schedule || []));
  }, [campaign.id, campaign.schedule]);

  const handleExportSchedule = () => {
    if (!schedule || schedule.length === 0) {
      showToast('No schedule elements to export');
      return;
    }
    let csv = 'Campaign,Go Live,Element,Status\n';
    schedule.forEach(({ date, element, status }: any) => {
      const escapedElement = element.replace(/"/g, '""');
      csv += `"${campaign.name}","${date}","${escapedElement}","${status}"\n`;
    });
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

  return (
    <div className="space-y-8">
      {campaignTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Linked Tasks</h3>
          <div className="space-y-2">
            {campaignTasks.map((task) => {
              const color = BRAND_COLOR[task.brand];
              return (
                <div key={task.id} className="px-3 py-2 rounded border text-sm" style={{ backgroundColor: `${color}10`, borderColor: color }}>
                  <div className="flex items-start gap-2">
                    <span style={{ color, fontWeight: 600, minWidth: '60px' }}>{BRAND_LABEL[task.brand]}</span>
                    <div className="flex-1">
                      <div style={{ color: 'var(--text-primary)' }} className="font-medium">{task.title}</div>
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
                  const originalIdx = schedule.findIndex((s) => s.id === item.id);
                  const date = new Date(item.date);
                  const displayDate = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
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
                            updateCampaign(campaign.id, { schedule: ensureScheduleIds(schedule) });
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
                            updateCampaign(campaign.id, { schedule: ensureScheduleIds(updated) });
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
              onClick={() => setSchedule([...schedule, { id: `schedule-${nanoid(10)}`, date: '', element: '', status: 'planning' as const }])}
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add milestone
            </button>
            <button onClick={handleExportSchedule} className="btn btn-secondary text-sm">
              Export as CSV
            </button>
            {campaign?.planDocument && (
              <button onClick={onViewPlan} className="btn btn-secondary text-sm flex items-center gap-2">
                <FileText size={16} />
                View Full Plan
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="v2-empty-state">No milestones added yet.</p>
      )}
    </div>
  );
}
