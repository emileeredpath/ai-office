import { REAL_TASKS, EMPLOYEES } from '@/data/mtechEmployees';
import { useCompletedTasks } from '@/contexts/CompletedTasksContext';

interface TeamMemberProfileProps {
  employeeId: string;
  onClose: () => void;
}

export function TeamMemberProfile({ employeeId, onClose }: TeamMemberProfileProps) {
  const employee = Object.values(EMPLOYEES).find((e) => e.id === employeeId);
  const { isTaskComplete, toggleTaskComplete } = useCompletedTasks();

  if (!employee) return null;

  const employeeTasks = REAL_TASKS.filter((t) => t.owner === employeeId);
  const completedCount = employeeTasks.filter((t) => isTaskComplete(t.id)).length;
  const inProgressCount = employeeTasks.filter((t) => t.status === 'in-progress').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div style={{ fontSize: '48px' }}>{employee.emoji}</div>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {employee.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>{employee.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-2xl font-bold transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Status</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px' }}>
                {employee.status === 'available' ? '✓ Available' : '🔴 Busy'}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Workload</p>
              <p style={{ color: '#F97031', fontWeight: 'bold', marginTop: '4px' }}>{employee.workload}%</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Tasks</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px' }}>{employeeTasks.length}</p>
            </div>
          </div>
        </div>

        {/* Workload Progress */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: 'var(--text-primary)' }}>Current Workload</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{employee.workload}%</span>
          </div>
          <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${employee.workload}%`,
                background: employee.workload > 80 ? '#EF4444' : '#F97031',
              }}
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px' }}>
            {employee.workload > 80 ? 'Overloaded - consider reassigning' : 'Healthy workload'}
          </p>
        </div>

        {/* Task Summary */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Task Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Completed</span>
              <span style={{ color: '#1D9E75', fontWeight: 'bold' }}>{completedCount}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>In Progress</span>
              <span style={{ color: '#F97031', fontWeight: 'bold' }}>{inProgressCount}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Pending</span>
              <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>
                {employeeTasks.length - completedCount - inProgressCount}
              </span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="p-6">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            My Tasks
          </h3>
          <div className="space-y-2">
            {employeeTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No tasks assigned</p>
            ) : (
              employeeTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded flex items-center gap-3"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={isTaskComplete(task.id)}
                    onChange={() => toggleTaskComplete(task.id)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: '#F97031' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: isTaskComplete(task.id) ? 'line-through' : 'none',
                        opacity: isTaskComplete(task.id) ? 0.6 : 1,
                      }}
                    >
                      {task.title}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {task.status.replace('-', ' ')} • {task.priority} priority
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
