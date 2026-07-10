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
    const blocked = employees.filter((e) => e.status === 'blocked').length;
    const completedToday = employees.reduce(
      (sum, e) =>
        sum +
        (e.tasks?.filter((t) => t.status === 'complete')
          .length || 0),
      0
    );
    const avgWorkload = employees.length > 0
      ? Math.round((totalTasks / employees.length) * 10) / 10
      : 0;
    return { working, totalTasks, totalApprovals, blocked, completedToday, avgWorkload };
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
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden p-8">
        {/* Left: Employee Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sandy Panel - Premium Compact */}
          <div
            className={`${
              darkMode
                ? 'bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 border-purple-700'
                : 'bg-gradient-to-br from-purple-200 via-purple-100 to-purple-50 border-purple-300'
            } border rounded-xl p-4 mb-6 shadow-lg`}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  darkMode
                    ? 'bg-purple-800 text-purple-100'
                    : 'bg-purple-300 text-purple-900'
                }`}
              >
                S
              </div>

              {/* Content */}
              <div className="flex-1">
                <div>
                  <h2 className={`font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                    Sandy
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Chief of Staff
                  </p>
                </div>

                {/* Summary */}
                <p className={`text-xs mt-2 leading-relaxed ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                  {stats.working === employees.length
                    ? `All ${employees.length} team members available.`
                    : `${employees.length - stats.working} of ${employees.length} team members available.`}{' '}
                  {stats.totalTasks === 0
                    ? 'No tasks currently assigned.'
                    : `${stats.totalTasks} ${stats.totalTasks === 1 ? 'task' : 'tasks'} in progress.`}
                </p>

                {/* Three Metrics */}
                <div className="flex gap-3 mt-3">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                      {stats.totalTasks}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      Assigned
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                      {stats.totalApprovals}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      Waiting
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                      {stats.completedToday}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Button */}
            <button
              onClick={onAskSandy}
              className={`w-full mt-3 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                darkMode
                  ? 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                  : 'bg-purple-300 hover:bg-purple-400 text-purple-900'
              }`}
            >
              Message Sandy
            </button>
          </div>

          {/* Employee Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
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
                    className={`${
                      darkMode
                        ? `${isSelected(employee.id) ? 'bg-slate-700 border-orange-500 shadow-md' : 'bg-slate-800 border-slate-700'} hover:bg-slate-700`
                        : `${isSelected(employee.id) ? 'bg-slate-50 border-orange-500 shadow-md' : 'bg-white border-slate-200'} hover:bg-slate-50`
                    } border rounded-xl p-4 cursor-pointer transition-all`}
                  >
                    {/* Avatar & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          darkMode
                            ? 'bg-slate-700 text-slate-100'
                            : 'bg-slate-200 text-slate-900'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-xs truncate ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {ROLE_DISPLAY_NAMES[employee.id] || employee.role}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
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
                            darkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          Current
                        </p>
                        <p
                          className={`text-xs line-clamp-2 ${
                            currentTask
                              ? darkMode
                                ? 'text-slate-300'
                                : 'text-slate-700'
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
                              darkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            Workload
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              workload > 80
                                ? 'text-red-400'
                                : workload > 60
                                ? 'text-amber-400'
                                : 'text-green-400'
                            }`}
                          >
                            {Math.round(workload)}%
                          </span>
                        </div>
                        <div
                          className={`w-full h-1.5 rounded-full ${
                            darkMode ? 'bg-slate-700' : 'bg-slate-300'
                          } overflow-hidden`}
                        >
                          <div
                            className={`h-full transition-all ${
                              workload > 80
                                ? 'bg-red-500'
                                : workload > 60
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${workload}%` }}
                          />
                        </div>
                      </div>

                      {/* Task Count Badge */}
                      {taskCount > 0 && (
                        <div className="pt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              taskCount > 3
                                ? darkMode
                                  ? 'bg-red-900 text-red-200'
                                  : 'bg-red-100 text-red-700'
                                : taskCount > 1
                                ? darkMode
                                  ? 'bg-amber-900 text-amber-200'
                                  : 'bg-amber-100 text-amber-700'
                                : darkMode
                                ? 'bg-green-900 text-green-200'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Open Button */}
                    <button
                      onClick={() => {
                        selectEmployee(employee.id);
                        onSelectRoom(employee.id);
                      }}
                      className={`w-full mt-3 py-1.5 px-3 rounded-lg font-medium text-xs transition-colors ${
                        darkMode
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-orange-100 hover:bg-orange-200 text-orange-900'
                      }`}
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto">
          {/* Today's To-Do */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-xl p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Today's To-Do
            </h3>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No tasks assigned to you yet
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-xl p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Upcoming Deadlines
            </h3>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No deadlines this week
            </div>
          </div>

          {/* Waiting for Approval */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-xl p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Waiting for Approval
            </h3>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.totalApprovals > 0
                ? `${stats.totalApprovals} ${stats.totalApprovals === 1 ? 'item' : 'items'} pending`
                : 'All caught up'}
            </div>
          </div>

          {/* Waiting for John */}
          <div
            className={`${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            } border rounded-xl p-4`}
          >
            <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Waiting for John
            </h3>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {(() => {
                const waitingForJohn = employees.reduce(
                  (sum, e) =>
                    sum +
                    (e.tasks?.filter((t) => t.status === 'waiting_john_approval')
                      .length || 0),
                  0
                );
                return waitingForJohn > 0
                  ? `${waitingForJohn} ${waitingForJohn === 1 ? 'item' : 'items'} pending`
                  : 'All reviewed';
              })()}
            </div>
          </div>

          {/* AI Insights */}
          <div
            className={`${
              darkMode
                ? 'bg-blue-950 border-blue-900'
                : 'bg-blue-50 border-blue-200'
            } border rounded-xl p-4`}
          >
            <h3 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
              ✨ AI Insights
            </h3>
            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              {stats.avgWorkload} tasks per person on average. {stats.blocked} blocked.
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom Activity Tabs */}
      <footer
        className={`${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } border-t px-8 py-4 flex flex-col`}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white border-orange-600'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-300 border-transparent hover:border-slate-700'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div
          className={`mt-4 p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          } text-sm`}
        >
          {activeTab === 'active' &&
            (stats.totalTasks > 0
              ? `${stats.totalTasks} ${stats.totalTasks === 1 ? 'task' : 'tasks'} in progress across the team`
              : 'Nothing is in progress. Ask Sandy to assign work.')}
          {activeTab === 'todo' &&
            'No tasks assigned to you yet'}
          {activeTab === 'activity' &&
            'Recent activity will appear here'}
          {activeTab === 'campaigns' &&
            'Campaign tracking will appear here'}
        </div>
      </footer>
    </div>
  );
}
