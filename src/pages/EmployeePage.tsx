import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEmployee } from '@/hooks/useEmployee';
import { StatusBadge } from '@/components/office/StatusBadge';
import { WorkloadBar } from '@/components/office/WorkloadBar';
import { Badge } from '@/components/ui/Badge';
import { DeskAvatar } from '@/components/office/DeskAvatar';
import { priorityColors } from '@/theme/tokens';

export function EmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employee } = useEmployee(id ?? '');

  if (!employee) {
    return (
      <div className="p-6 text-center" style={{ color: '#8F9194' }}>
        Employee not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: '#8F9194' }}
      >
        <ArrowLeft size={14} />
        Back to Office
      </button>

      {/* Header */}
      <div
        className="rounded-xl p-6 mb-5 relative overflow-hidden"
        style={{ backgroundColor: '#1D2A3A', border: '1px solid #3a4f6a' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: employee.accentColor }}
        />
        <div className="flex items-start gap-5">
          <div className="pt-2">
            <DeskAvatar
              emoji={employee.emoji}
              idleAnimation={employee.idleAnimation}
              accentColor={employee.accentColor}
            />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl mb-1" style={{ color: '#F0F4F8' }}>
              {employee.name}
            </h1>
            <div className="mb-3">
              <StatusBadge status={employee.status} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {employee.personality.map((trait) => (
                <Badge key={trait} label={trait} color={employee.accentColor} small />
              ))}
            </div>
            <WorkloadBar percent={employee.workloadPercent} accentColor={employee.accentColor} />
          </div>
        </div>
      </div>

      {/* Current Task */}
      <Section title="Current Task" accentColor={employee.accentColor}>
        {employee.currentTask ? (
          <TaskItem task={employee.currentTask} />
        ) : (
          <p className="text-sm italic" style={{ color: '#8F9194' }}>No active task</p>
        )}
      </Section>

      {/* Queue */}
      <Section title={`Task Queue (${employee.taskQueue.length})`} accentColor={employee.accentColor}>
        {employee.taskQueue.length === 0 ? (
          <p className="text-sm italic" style={{ color: '#8F9194' }}>Queue is empty</p>
        ) : (
          <div className="space-y-2">
            {employee.taskQueue.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </Section>

      {/* Completed */}
      <Section title={`Completed (${employee.completedWork.length})`} accentColor={employee.accentColor}>
        {employee.completedWork.length === 0 ? (
          <p className="text-sm italic" style={{ color: '#8F9194' }}>Nothing completed yet</p>
        ) : (
          <div className="space-y-2">
            {employee.completedWork.map((task) => (
              <TaskItem key={task.id} task={task} completed />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{ backgroundColor: '#1D2A3A', border: '1px solid #3a4f6a' }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: accentColor }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function TaskItem({
  task,
  completed = false,
}: {
  task: { id: string; title: string; priority: string; completedAt?: string };
  completed?: boolean;
}) {
  const priorityColor = priorityColors[task.priority] ?? '#6b7280';
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#243347' }}
    >
      <span style={{ color: completed ? '#8F9194' : '#F0F4F8' }}>{task.title}</span>
      <Badge label={task.priority} color={priorityColor} small />
    </div>
  );
}
