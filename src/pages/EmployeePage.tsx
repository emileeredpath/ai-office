import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useEmployee } from '@/hooks/useEmployee';
import { useOfficeStore } from '@/store/officeStore';
import { StatusBadge } from '@/components/office/StatusBadge';
import { WorkloadBar } from '@/components/office/WorkloadBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeskAvatar } from '@/components/office/DeskAvatar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskMenu } from '@/components/tasks/TaskMenu';
import { priorityColors } from '@/theme/tokens';

export function EmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employee } = useEmployee(id ?? '');
  const { moveToCurrentTask, reassignTask, removeTask, completeCurrentTask } = useOfficeStore();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  if (!employee) {
    return (
      <div className="p-6 text-center" style={{ color: '#8F9194' }}>
        Employee not found.
      </div>
    );
  }

  const handleCompleteCurrentTask = () => {
    completeCurrentTask(employee.id);
  };

  const handleMoveToCurrentTask = (taskId: string) => {
    const task = employee.taskQueue.find((t) => t.id === taskId);
    if (task) {
      // Move current task to completed, promote this task
      if (employee.currentTask) {
        completeCurrentTask(employee.id);
      }
      moveToCurrentTask(employee.id);
    }
  };

  const handleReassignTask = (taskId: string, toEmployeeId: string) => {
    reassignTask(taskId, employee.id, toEmployeeId);
  };

  const handleRemoveTask = (taskId: string, bucket: 'current' | 'queue' | 'completed') => {
    removeTask(employee.id, taskId, bucket);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: '#8F9194' }}
      >
        <ArrowLeft size={14} />
        Back to Office
      </button>

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

      <Section title="Current Task" accentColor={employee.accentColor}>
        {employee.currentTask ? (
          <div className="space-y-3">
            <TaskItem
              task={employee.currentTask}
              bucket="current"
              employeeId={employee.id}
              onMakeCurrent={() => {}}
              onMarkComplete={handleCompleteCurrentTask}
              onDelete={() => handleRemoveTask(employee.currentTask!.id, 'current')}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCompleteCurrentTask}
              className="w-full"
            >
              Mark Complete
            </Button>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: '#8F9194' }}>No active task</p>
        )}
      </Section>

      <Section title={`Task Queue (${employee.taskQueue.length})`} accentColor={employee.accentColor}>
        {employee.taskQueue.length === 0 ? (
          <p className="text-sm italic mb-3" style={{ color: '#8F9194' }}>Queue is empty</p>
        ) : (
          <div className="space-y-2 mb-3">
            {employee.taskQueue.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                bucket="queue"
                employeeId={employee.id}
                onMakeCurrent={() => handleMoveToCurrentTask(task.id)}
                onReassign={(toId) => handleReassignTask(task.id, toId)}
                onDelete={() => handleRemoveTask(task.id, 'queue')}
              />
            ))}
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsAddTaskOpen(true)}
          icon={<Plus size={14} />}
          className="w-full"
        >
          Add Task
        </Button>
      </Section>

      <Section title={`Completed (${employee.completedWork.length})`} accentColor={employee.accentColor}>
        {employee.completedWork.length === 0 ? (
          <p className="text-sm italic" style={{ color: '#8F9194' }}>Nothing completed yet</p>
        ) : (
          <div className="space-y-2">
            {employee.completedWork.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                bucket="completed"
                completed
                employeeId={employee.id}
                onDelete={() => handleRemoveTask(task.id, 'completed')}
                onRestore={() => handleRemoveTask(task.id, 'completed')}
              />
            ))}
          </div>
        )}
      </Section>

      <TaskForm isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} employeeId={employee.id} />
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

interface TaskItemProps {
  task: { id: string; title: string; priority: string; description?: string; completedAt?: string };
  bucket: 'current' | 'queue' | 'completed';
  employeeId: string;
  completed?: boolean;
  onMakeCurrent?: () => void;
  onMarkComplete?: () => void;
  onBackToQueue?: () => void;
  onReassign?: (toId: string) => void;
  onDelete: () => void;
  onRestore?: () => void;
}

function TaskItem({
  task,
  bucket,
  employeeId,
  completed = false,
  onMakeCurrent,
  onMarkComplete,
  onBackToQueue,
  onReassign,
  onDelete,
  onRestore,
}: TaskItemProps) {
  const priorityColor = priorityColors[task.priority] ?? '#6b7280';
  return (
    <div
      className="group flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#243347' }}
    >
      <div className="flex-1">
        <div style={{ color: completed ? '#8F9194' : '#F0F4F8' }}>{task.title}</div>
        {task.description && (
          <div className="text-xs mt-1" style={{ color: '#8F9194' }}>
            {task.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge label={task.priority} color={priorityColor} small />
        <TaskMenu
          bucket={bucket}
          employeeId={employeeId}
          onMakeCurrent={onMakeCurrent}
          onMarkComplete={onMarkComplete}
          onBackToQueue={onBackToQueue}
          onReassign={onReassign}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      </div>
    </div>
  );
}
