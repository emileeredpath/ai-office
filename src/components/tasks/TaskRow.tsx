import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types/index';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const selectTask = useAppStore((s) => s.selectTask);
  const getCampaignById = useAppStore((s) => s.getCampaignById);
  const completeTask = useAppStore((s) => s.completeTask);
  const reopenTask = useAppStore((s) => s.reopenTask);
  const { isEditor } = useAuth();

  const campaign = task.campaignId ? getCampaignById(task.campaignId) : null;
  const completed = task.status === 'complete';

  const priorityColor =
    task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F97031' : '#9CA3AF';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !completed && !!task.deadline && new Date(task.deadline) < today;

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
    <tr
      onClick={handleClick}
      className={completed ? 'opacity-60' : ''}
      style={isOverdue ? { backgroundColor: '#FEF2F2' } : undefined}
    >
      <td className="w-full" style={{ borderLeft: `3px solid ${priorityColor}` }}>
        <div className="flex items-center gap-3 pl-2">
          <button
            onClick={isEditor ? handleToggleComplete : (e) => e.stopPropagation()}
            title={isEditor ? (completed ? 'Reopen task' : 'Mark complete') : 'View only'}
            disabled={!isEditor}
            className={`flex-shrink-0 text-text-secondary transition-colors ${isEditor ? 'hover:text-success' : 'cursor-default'}`}
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
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {isOverdue && (
            <span className="badge" style={{ background: '#EF4444', color: 'white' }}>
              Overdue
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="text-sm">
          {task.priority === 'high' && <span className="badge" style={{ background: '#EF4444', color: 'white' }}>High</span>}
          {task.priority === 'medium' && <span className="badge" style={{ background: '#f97031', color: 'white' }}>Medium</span>}
          {task.priority === 'low' && <span className="badge" style={{ background: '#9ca3af', color: 'white' }}>Low</span>}
        </div>
      </td>
      <td className="text-sm" style={{ color: isOverdue ? '#EF4444' : 'var(--color-text-secondary)' }}>
        {task.deadline ? formatDate(task.deadline) : '—'}
      </td>
    </tr>
  );
}
