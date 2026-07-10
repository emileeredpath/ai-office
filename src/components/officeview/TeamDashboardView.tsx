import { useState, useMemo } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_LABELS } from '@/types/employee';
import { SandyDock } from './SandyDock';
import { ROLE_DISPLAY_NAMES } from './OfficeProps';

interface TeamDashboardViewProps {
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onAskSandy?: () => void;
}

export function TeamDashboardView({
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
  onAskSandy,
}: TeamDashboardViewProps) {
  const employees = useOfficeStore((state) => state.employees);
  const selectedEmployeeId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);
  const [activeTab, setActiveTab] = useState<'active' | 'todo' | 'activity' | 'campaigns'>('active');
  const [darkMode, setDarkMode] = useState(true);

  const stats = useMemo(() => {
    const working = employees.filter((e) => e.status === 'working').length;
    const totalTasks = employees.reduce((sum, e) => sum + (e.tasks?.length || 0), 0);
    const totalApprovals = employees.reduce(
      (sum, e) =>
        sum +
        (e.tasks?.filter((t) => t.status === 'waiting_review' || t.status === 'waiting_john_approval')
          .length || 0),
      0
    );
    return { working, totalTasks, totalApprovals };
  }, [employees]);

  const isSelected = (id: string) => selectedEmployeeId === id;

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${
        darkMode
          ? 'bg-slate-950 text-slate-50'
          : 'bg-white text-slate-900'
      }`}
    >
      {/* Header */}
      <header
        className={`${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } border-b px-8 py-6`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Marketing Team</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.working} working • {stats.totalTasks} active tasks • {stats.totalApprovals} approvals
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onAskSandy}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Ask Sandy
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex gap-6 overflow-hidden p-8">
        {/* Left: Employee Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sandy Panel */}
          <div
            className={`${
              darkMode
                ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700'
                : 'bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200'
            } border rounded-xl p-6 mb-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                  Sandy
                </h2>
                <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  Chief of Staff
                </p>
                {sandyMessage && (
                  <p className={`mt-3 text-sm ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                    "{sandyMessage}"
                  </p>
                )}
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                    {stats.totalTasks}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Tasks</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                    {stats.totalApprovals}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Approvals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {employees.map((employee) => {
                const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
                const statusLabel = EMPLOYEE_STATUS_LABELS[employee.status];
                const taskCount = employee.tasks?.length || 0;
                const currentTask = employee.tasks?.[0];
                const workload = Math.min(100, (taskCount / 5) * 100);
                const initials = ROLE_DISPLAY_NAMES[employee.id]
                  ?.split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase() || '?';

                return (
                  <div
                    key={employee.id}
                    onClick={() => {
                      selectEmployee(employee.id);
                      onSelectRoom(employee.id);
                    }}
                    className={`${
                      darkMode
                        ? `${isSelected(employee.id) ? 'bg-slate-800 border-orange-500' : 'bg-slate-800 border-slate-700'} hover:bg-slate-700`
                        : `${isSelected(employee.id) ? 'bg-slate-100 border-orange-500' : 'bg-white border-slate-200'} hover:bg-slate-50`
                    } border rounded-lg p-4 cursor-pointer transition-all`}
                  >
                    {/* Avatar & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          darkMode
                            ? 'bg-slate-700 text-slate-100'
                            : 'bg-slate-200 text-slate-900'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm truncate ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {ROLE_DISPLAY_NAMES[employee.id] || employee.role}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusColor }}
                          />
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task Info */}
                    <div className="space-y-2">
                      <div>
                        <p
                          className={`text-xs font-medium mb-1 ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Current Task
                        </p>
                        <p
                          className={`text-xs truncate ${
                            currentTask
                              ? darkMode
                                ? 'text-slate-400'
                                : 'text-slate-600'
                              : darkMode
                              ? 'text-slate-500 italic'
                              : 'text-slate-500 italic'
                          }`}
                        >
                          {currentTask ? currentTask.title : 'No active task'}
                        </p>
                      </div>

                      {/* Workload Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-medium ${
                              darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            Workload
                          </span>
                          <span
                            className={`text-xs ${
                              darkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {taskCount}
                          </span>
                        </div>
                        <div
                          className={`w-full h-2 rounded-full ${
                            darkMode ? 'bg-slate-700' : 'bg-slate-300'
                          } overflow-hidden`}
                        >
                          <div
                            className={`h-full transition-all ${
                              workload > 80
                                ? 'bg-red-500'
                                : workload > 60
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${workload}%` }}
                          />
                        </div>
                      </div>

                      {/* Task Count Badge */}
                      {taskCount > 0 && (
                        <div className="flex gap-2 pt-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              taskCount > 3
                                ? 'bg-red-900 text-red-200'
                                : taskCount > 1
                                ? 'bg-orange-900 text-orange-200'
                                : 'bg-green-900 text-green-200'
                            }`}
                          >
                            {taskCount} task{taskCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 flex flex-col gap-6 overflow-y-auto">
          {/* Today's To-Do */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-lg p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Today's To-Do
            </h3>
            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No tasks assigned to you yet
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-lg p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Upcoming Deadlines
            </h3>
            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No deadlines this week
            </div>
          </div>

          {/* Team Workload */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-lg p-4`}
          >
            <h3 className={`font-semibold text-sm mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Team Workload
            </h3>
            <div className="space-y-3">
              {employees.slice(0, 4).map((emp) => (
                <div key={emp.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {(ROLE_DISPLAY_NAMES[emp.id] || emp.role).split(' ')[0]}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {emp.tasks?.length || 0}
                    </span>
                  </div>
                  <div
                    className={`w-full h-1.5 rounded-full ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.min(100, ((emp.tasks?.length || 0) / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting for Approval */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-lg p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Waiting for Approval
            </h3>
            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.totalApprovals > 0 ? `${stats.totalApprovals} items pending` : 'All caught up'}
            </div>
          </div>

          {/* AI Insights */}
          <div
            className={`${
              darkMode
                ? 'bg-blue-950 border-blue-900'
                : 'bg-blue-50 border-blue-200'
            } border rounded-lg p-4`}
          >
            <h3 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
              ✨ AI Insights
            </h3>
            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              8 team members have capacity for new work
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Activity Tabs */}
      <footer
        className={`${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } border-t px-8 py-4`}
      >
        <div className="flex gap-6 max-w-7xl mx-auto">
          {[
            { id: 'active', label: 'Active Tasks', icon: '⚡' },
            { id: 'todo', label: 'My To-Do', icon: '✓' },
            { id: 'activity', label: 'Activity Feed', icon: '📝' },
            { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className={`mt-4 p-4 rounded-lg ${
          darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
        } text-sm`}>
          {activeTab === 'active' && `${stats.totalTasks} active tasks across the team`}
          {activeTab === 'todo' && 'No tasks assigned to you yet'}
          {activeTab === 'activity' && 'Recent activity will appear here'}
          {activeTab === 'campaigns' && 'Campaign tracking will appear here'}
        </div>
      </footer>
    </div>
  );
}
