import { useMemo } from 'react';
import { Campaign, Task } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { formatDateShort } from '@/utils/dateUtils';
import { CampaignCalendarTab } from '@/components/campaigns/CampaignCalendarTab';

interface CampaignActivityTasksTabProps {
  campaign: Campaign;
  campaignTasks: Task[];
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  showToast: (message: string) => void;
}

const isComplete = (task: Task) => task.status === 'complete';

// Combines the former Calendar tab (milestone/schedule CRUD, unchanged
// logic — reused as-is below) with the campaign's linked tasks, grouped
// by where they stand today. No task data or cascade logic changes here;
// this only groups and displays what already exists.
export function CampaignActivityTasksTab({ campaign, campaignTasks, updateCampaign, showToast }: CampaignActivityTasksTabProps) {
  const now = useMemo(() => new Date(), []);
  const deadlineTime = (t: Task) => (t.deadline ? new Date(t.deadline).getTime() : Number.POSITIVE_INFINITY);

  const overdueTasks = useMemo(
    () => campaignTasks.filter((t) => !isComplete(t) && t.deadline && new Date(t.deadline) < now).sort((a, b) => deadlineTime(a) - deadlineTime(b)),
    [campaignTasks, now]
  );
  const upcomingTasks = useMemo(
    () => campaignTasks.filter((t) => !isComplete(t) && (!t.deadline || new Date(t.deadline) >= now)).sort((a, b) => deadlineTime(a) - deadlineTime(b)),
    [campaignTasks, now]
  );
  const completedTasks = useMemo(() => campaignTasks.filter(isComplete), [campaignTasks]);

  return (
    <div className="space-y-8">
      <TaskGroup title="Overdue" tasks={overdueTasks} emptyLabel="No overdue tasks." highlight="red" />
      <TaskGroup title="Upcoming" tasks={upcomingTasks} emptyLabel="No upcoming tasks." />
      <TaskGroup title="Completed" tasks={completedTasks} emptyLabel="No completed tasks yet." />

      <div>
        <h3 className="v2-section-title">Campaign Timeline</h3>
        <p className="text-sm text-text-secondary mb-3">Milestones and schedule for this campaign.</p>
        <CampaignCalendarTab
          campaign={campaign}
          campaignTasks={[]}
          updateCampaign={updateCampaign}
          showToast={showToast}
          onViewPlan={() => {}}
          hasPlan={false}
        />
      </div>
    </div>
  );
}

function TaskGroup({ title, tasks, emptyLabel, highlight }: { title: string; tasks: Task[]; emptyLabel: string; highlight?: 'red' }) {
  return (
    <div>
      <h3 className="v2-section-title">
        {title} {tasks.length > 0 && <span className="text-text-secondary font-normal">({tasks.length})</span>}
      </h3>
      {tasks.length === 0 ? (
        <p className="v2-empty-state">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const color = BRAND_COLOR[task.brand];
            return (
              <div
                key={task.id}
                className="px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: `${color}10`,
                  borderColor: highlight === 'red' ? 'var(--v2-red, #ef4444)' : color,
                }}
              >
                <div className="flex items-start gap-2">
                  <span style={{ color, fontWeight: 600, minWidth: '60px' }}>{BRAND_LABEL[task.brand]}</span>
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
      )}
    </div>
  );
}
