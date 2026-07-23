import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types/index';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';
import { CheckCircle2, Circle } from 'lucide-react';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const selectTask = useAppStore((s) => s.selectTask);
  const getCampaignById = useAppStore((s) => s.getCampaignById);
  const completeTask = useAppStore((s) => s.completeTask);
  const reopenTask = useAppStore((s) => s.reopenTask);

  const campaign = task.campaignId ? getCampaignById(task.campaignId) : null;
  const completed = task.status === 'complete';

  const handleClick = () => {
    selectTask(task.id);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completed) {
      reopenTask(task.id);
    } else {
      completeTask(task.id);
    }
  };

  return (
    <tr onClick={handleClick} className={completed ? 'opacity-60' : ''}>
      <td className="w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleComplete}
            title={completed ? 'Reopen task' : 'Mark complete'}
            className="flex-shrink-0 text-text-secondary hover:text-success transition-colors"
          >
            {completed ? (
              <CheckCircle2 size={20} className="text-success" />
            ) : (
              <Circle size={20} />
            )}
          </button>
          <div className="flex-1">
            <div className={`font-medium ${completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
              {task.title}
            </div>
            {campaign && <div className="text-sm text-text-secondary">{campaign.name}</div>}
            {completed && task.completedAt && (
              <div className="text-xs text-text-secondary">Completed {formatDate(task.completedAt)}</div>
            )}
          </div>
        </div>
      </td>
      <td>
        <BrandBadge brand={task.brand} />
      </td>
      <td>
        <StatusBadge status={task.status} />
      </td>
      <td>
        <div className="text-sm">
          {task.priority === 'high' && <span className="badge badge-danger">High</span>}
          {task.priority === 'medium' && <span className="badge" style={{ background: '#f97031', color: 'white' }}>Medium</span>}
          {task.priority === 'low' && <span className="badge" style={{ background: '#9ca3af', color: 'white' }}>Low</span>}
        </div>
      </td>
      <td className="text-sm text-text-secondary">
        {task.deadline ? formatDate(task.deadline) : '—'}
      </td>
    </tr>
  );
}
