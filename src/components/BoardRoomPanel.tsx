import { useOfficeStore } from '@/store/officeStore';
import { Calendar, Users, TrendingUp, CheckCircle } from 'lucide-react';

export function BoardRoomPanel() {
  const employees = useOfficeStore((state) => state.employees);

  // Calculate team metrics
  const totalTasks = employees.reduce((sum, emp) => sum + emp.taskQueue.length, 0);
  const completedTasks = employees.reduce((sum, emp) => sum + emp.completedWork.length, 0);
  const avgWorkload = Math.round(
    employees.reduce((sum, emp) => sum + emp.workloadPercent, 0) / employees.length
  );
  const busyCount = employees.filter((e) => e.status === 'busy').length;

  // Get upcoming high-priority tasks
  const upcomingTasks = employees
    .flatMap((emp) =>
      emp.taskQueue.slice(0, 2).map((task) => ({
        ...task,
        employee: emp.name,
        employeeEmoji: emp.emoji,
      }))
    )
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  // Get recent completions
  const recentCompletions = employees
    .flatMap((emp) =>
      emp.completedWork.slice(0, 1).map((task) => ({
        ...task,
        employee: emp.name,
        employeeEmoji: emp.emoji,
      }))
    )
    .slice(0, 3);

  return (
    <div
      className="w-80 flex flex-col border-l overflow-hidden"
      style={{
        backgroundColor: '#0F1419',
        borderColor: '#2E3B4A',
      }}
    >
      {/* Board Room Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: '#2E3B4A' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏛️</span>
          <h2 className="text-lg font-bold text-[#F0F4F8]">Board Room</h2>
        </div>
        <p className="text-xs text-[#8F9194]">Weekly Strategy Review</p>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Team Status Cards */}
        <div className="px-6 py-4 space-y-3 border-b" style={{ borderColor: '#2E3B4A' }}>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#1D2A3A' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#8F9194]">Team Capacity</span>
              <span className="text-sm font-semibold text-[#F9701F]">{avgWorkload}%</span>
            </div>
            <div className="w-full bg-[#111B26] rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${avgWorkload}%`,
                  backgroundColor: avgWorkload > 80 ? '#FF6B6B' : avgWorkload > 60 ? '#F9701F' : '#4CAF50',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: '#1D2A3A' }}
            >
              <div className="text-sm font-semibold text-[#F9701F]">{busyCount}/8</div>
              <div className="text-xs text-[#8F9194] mt-1">Active</div>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: '#1D2A3A' }}
            >
              <div className="text-sm font-semibold text-[#4CAF50]">{totalTasks}</div>
              <div className="text-xs text-[#8F9194] mt-1">Queued</div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#2E3B4A' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-[#F9701F]" />
            <h3 className="text-xs font-semibold text-[#F0F4F8] uppercase">Next Priority</h3>
          </div>
          <div className="space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded text-xs border-l-2"
                  style={{
                    backgroundColor: '#1D2A3A',
                    borderColor: task.priority === 'high' ? '#FF6B6B' : task.priority === 'medium' ? '#F9701F' : '#4CAF50',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[#F0F4F8] font-medium line-clamp-2">{task.title}</p>
                      <p className="text-[#8F9194] mt-1">{task.employeeEmoji} {task.employee}</p>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs capitalize whitespace-nowrap"
                      style={{
                        backgroundColor: task.priority === 'high' ? 'rgba(255, 107, 107, 0.2)' : task.priority === 'medium' ? 'rgba(249, 112, 31, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                        color: task.priority === 'high' ? '#FF6B6B' : task.priority === 'medium' ? '#F9701F' : '#4CAF50',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8F9194] text-center py-2">No upcoming tasks</p>
            )}
          </div>
        </div>

        {/* Recent Completions */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#2E3B4A' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-[#4CAF50]" />
            <h3 className="text-xs font-semibold text-[#F0F4F8] uppercase">Completed</h3>
          </div>
          <div className="space-y-2">
            {recentCompletions.length > 0 ? (
              recentCompletions.map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded text-xs"
                  style={{
                    backgroundColor: '#1D2A3A',
                    borderLeft: '2px solid #4CAF50',
                  }}
                >
                  <p className="text-[#F0F4F8] line-clamp-2">{task.title}</p>
                  <p className="text-[#8F9194] mt-1 text-xs">{task.employeeEmoji} {task.employee}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8F9194] text-center py-2">No recent completions</p>
            )}
          </div>
        </div>

        {/* Team Activity */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-[#2196F3]" />
            <h3 className="text-xs font-semibold text-[#F0F4F8] uppercase">Team Status</h3>
          </div>
          <div className="space-y-2">
            {employees.slice(0, 6).map((emp) => (
              <div key={emp.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{emp.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[#F0F4F8] font-medium">{emp.name}</p>
                    <p className="text-[#8F9194] text-xs">{emp.workloadPercent}%</p>
                  </div>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      emp.status === 'busy'
                        ? '#F9701F'
                        : emp.status === 'available'
                          ? '#4CAF50'
                          : emp.status === 'in-review'
                            ? '#2196F3'
                            : '#8F9194',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board Room Footer */}
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
