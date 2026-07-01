import { useOfficeStore } from '@/store/officeStore';
import type { TaskStatus } from '@/types/employee';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/types/employee';
import { Play, CheckCircle2, ShieldAlert, Ban } from 'lucide-react';

const COLUMNS: TaskStatus[] = [
  'backlog',
  'assigned',
  'awaiting_brief',
  'in_progress',
  'waiting_review',
  'waiting_john_approval',
  'waiting_customer',
  'blocked',
  'complete',
];

export function TasksBoard() {
  const employees = useOfficeStore((state) => state.employees);
  const startTask = useOfficeStore((state) => state.startTask);
  const completeTask = useOfficeStore((state) => state.completeTask);
  const setTaskStatus = useOfficeStore((state) => state.setTaskStatus);

  const allTasks = employees.flatMap((emp) =>
    emp.tasks.map((task) => ({ ...task, employeeId: emp.id, employeeName: emp.name, employeeEmoji: emp.emoji }))
  );

  const hasAnyTasks = allTasks.length > 0;

  return (
    <div className="w-full h-full overflow-x-auto p-6" style={{ backgroundColor: '#05080D' }}>
      {!hasAnyTasks ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm" style={{ color: '#5C6879' }}>
            No tasks yet — ask Sandy at the top to get the team started.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 h-full">
          {COLUMNS.map((status) => {
            const columnTasks = allTasks.filter((t) => t.status === status);
            if (columnTasks.length === 0) return null;
            return (
              <div key={status} className="w-64 flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
                  />
                  <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#E8ECF1' }}>
                    {TASK_STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs" style={{ color: '#5C6879' }}>
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg p-3 border-l-2"
                      style={{ backgroundColor: '#0F1620', borderColor: TASK_STATUS_COLORS[status] }}
                    >
                      <p className="text-xs font-medium mb-1" style={{ color: '#E8ECF1' }}>
                        {task.title}
                      </p>
                      <p className="text-xs mb-2" style={{ color: '#5C6879' }}>
                        {task.employeeEmoji} {task.employeeName}
                      </p>
                      {task.status !== 'complete' && (
                        <div className="flex gap-1">
                          {task.status !== 'in_progress' && (
                            <IconButton
                              icon={<Play size={11} />}
                              color="#F9701F"
                              title="Start"
                              onClick={() => startTask(task.employeeId, task.id)}
                            />
                          )}
                          <IconButton
                            icon={<ShieldAlert size={11} />}
                            color="#FB6B6B"
                            title="Waiting for John"
                            onClick={() => setTaskStatus(task.employeeId, task.id, 'waiting_john_approval')}
                          />
                          <IconButton
                            icon={<Ban size={11} />}
                            color="#E53935"
                            title="Blocked"
                            onClick={() => setTaskStatus(task.employeeId, task.id, 'blocked')}
                          />
                          <IconButton
                            icon={<CheckCircle2 size={11} />}
                            color="#4ADE80"
                            title="Complete"
                            onClick={() => completeTask(task.employeeId, task.id)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconButton({
  icon,
  color,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 rounded transition-colors"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {icon}
    </button>
  );
}
