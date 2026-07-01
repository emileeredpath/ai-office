import { useOfficeStore } from '@/store/officeStore';
import { EMPLOYEE_STATUS_COLORS } from '@/types/employee';
import { Calendar, Users, ListChecks, CheckCircle, ShieldAlert } from 'lucide-react';

export function BoardRoomPanel() {
  const employees = useOfficeStore((state) => state.employees);

  const allTasks = employees.flatMap((emp) =>
    emp.tasks.map((task) => ({ ...task, employee: emp.name, employeeEmoji: emp.emoji }))
  );

  const assigned = allTasks.filter((t) => t.status === 'assigned' || t.status === 'awaiting_brief');
  const inProgress = allTasks.filter((t) => t.status === 'in_progress');
  const waitingForJohn = allTasks.filter((t) => t.status === 'waiting_john_approval');
  const completed = allTasks
    .filter((t) => t.status === 'complete')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const workingCount = employees.filter((e) => e.status === 'working').length;

  return (
    <div
      className="w-80 flex flex-col border-l overflow-hidden"
      style={{ backgroundColor: '#0F1419', borderColor: '#2E3B4A' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: '#2E3B4A' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏛️</span>
          <h2 className="text-lg font-bold text-[#F0F4F8]">Board Room</h2>
        </div>
        <p className="text-xs text-[#8F9194]">Live workflow overview</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Summary counts */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b" style={{ borderColor: '#2E3B4A' }}>
          <SummaryStat label="Working" value={workingCount} color="#F9701F" />
          <SummaryStat label="Assigned" value={assigned.length} color="#2196F3" />
          <SummaryStat label="Waiting on John" value={waitingForJohn.length} color="#FF6B6B" />
          <SummaryStat label="Complete" value={completed.length} color="#4CAF50" />
        </div>

        {/* In Progress */}
        <TaskSection
          icon={<ListChecks size={14} className="text-[#F9701F]" />}
          title="In Progress"
          tasks={inProgress}
          emptyLabel="Nothing in progress"
          accentColor="#F9701F"
        />

        {/* Waiting for John */}
        <TaskSection
          icon={<ShieldAlert size={14} className="text-[#FF6B6B]" />}
          title="Waiting for John"
          tasks={waitingForJohn}
          emptyLabel="Nothing pending approval"
          accentColor="#FF6B6B"
        />

        {/* Assigned (not yet started) */}
        <TaskSection
          icon={<Users size={14} className="text-[#2196F3]" />}
          title="Assigned"
          tasks={assigned}
          emptyLabel="No tasks assigned yet"
          accentColor="#2196F3"
        />

        {/* Complete */}
        <TaskSection
          icon={<CheckCircle size={14} className="text-[#4CAF50]" />}
          title="Complete"
          tasks={completed.slice(0, 5)}
          emptyLabel="Nothing completed yet"
          accentColor="#4CAF50"
        />

        {/* Team Status */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-[#2196F3]" />
            <h3 className="text-xs font-semibold text-[#F0F4F8] uppercase">Team Status</h3>
          </div>
          <div className="space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{emp.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[#F0F4F8] font-medium">{emp.name}</p>
                    <p className="text-[#8F9194] text-xs">
                      {emp.tasks.filter((t) => t.status !== 'complete').length} active
                    </p>
                  </div>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: EMPLOYEE_STATUS_COLORS[emp.status] }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="px-6 py-3 border-t text-xs text-[#8F9194] flex items-center gap-2"
        style={{ borderColor: '#2E3B4A' }}
      >
        <Calendar size={12} />
        <span>Next standup: Friday 5pm</span>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#1D2A3A' }}>
      <div className="text-sm font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[#8F9194] mt-1">{label}</div>
    </div>
  );
}

function TaskSection({
  icon,
  title,
  tasks,
  emptyLabel,
  accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  tasks: Array<{ id: string; title: string; employee: string; employeeEmoji: string; priority: string }>;
  emptyLabel: string;
  accentColor: string;
}) {
  return (
    <div className="px-6 py-4 border-b" style={{ borderColor: '#2E3B4A' }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-[#F0F4F8] uppercase">{title}</h3>
        <span className="text-xs text-[#8F9194]">({tasks.length})</span>
      </div>
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-2 rounded text-xs border-l-2"
              style={{ backgroundColor: '#1D2A3A', borderColor: accentColor }}
            >
              <p className="text-[#F0F4F8] font-medium line-clamp-2">{task.title}</p>
              <p className="text-[#8F9194] mt-1">
                {task.employeeEmoji} {task.employee}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-[#8F9194] text-center py-2">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
