import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types/index';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';
import { CheckCircle2 } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  completed?: boolean;
}

export function TaskRow({ task, completed }: TaskRowProps) {
  const selectTask = useAppStore((s) => s.selectTask);
  const getCampaignById = useAppStore((s) => s.getCampaignById);

  const campaign = task.campaignId ? getCampaignById(task.campaignId) : null;

  const handleClick = () => {
    selectTask(task.id);
  };

  return (
    <tr onClick={handleClick} className={completed ? 'opacity-60' : ''}>
      <td className="w-full">
        <div className="flex items-center gap-3">
          {completed && <CheckCircle2 size={18} className="text-success flex-shrink-0" />}
          <div className="flex-1">
            <div className={`font-medium ${completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
              {task.title}
            </div>
            {campaign && <div className="text-sm text-text-secondary">{campaign.name}</div>}
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
