import { useState, useMemo } from 'react';
import { EMPLOYEES, REAL_TASKS, BRANDS } from '@/data/mtechEmployees';

interface TodaysWorkProps {
  companyId: string;
  currentUserId: string;
}

export function TodaysWork({ companyId, currentUserId }: TodaysWorkProps) {
  const [sandyInput, setSandyInput] = useState('');

  const todayDate = new Date();
  const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate Sandy's briefing from real data
  const briefingStats = useMemo(() => {
    const waitingForJohn = REAL_TASKS.filter((t) => t.status === 'waiting-john');
    const inProgress = REAL_TASKS.filter((t) => t.status === 'in-progress');
    const dueSoon = REAL_TASKS.filter((t) => t.deadline && new Date(t.deadline) <= new Date(Date.now() + 86400000)); // Next 24 hours

    return {
      approvalsWaiting: waitingForJohn.length,
      deadlinesToday: dueSoon.length,
      tasksInProgress: inProgress.length,
    };
  }, []);

  // Get today's focus (high priority, waiting for john, or in progress)
  const todaysFocus = useMemo(() => {
    return REAL_TASKS.filter((t) =>
      t.status === 'waiting-john' || (t.status === 'in-progress' && t.priority === 'high')
    ).slice(0, 3);
  }, []);

  // Get waiting for john tasks
  const waitingForJohnTasks = useMemo(() => {
    return REAL_TASKS.filter((t) => t.status === 'waiting-john');
  }, []);

  // Get busy team members
  const busyTeam = useMemo(() => {
    return Object.values(EMPLOYEES)
      .filter((e) => e.status === 'busy' && e.id !== 'sandy')
      .slice(0, 3);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting-john':
        return '#F59E0B';
      case 'in-progress':
        return '#1D9E75';
      case 'waiting-approval':
        return '#F97031';
      case 'complete':
        return '#5C6879';
      default:
        return '#5C6879';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '🟢';
      case 'available':
        return '⚫';
      case 'busy':
        return '🟠';
      case 'waiting':
        return '🟡';
      case 'blocked':
        return '🔴';
      default:
        return '⚫';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: '#070A0F' }}>
      <div className="max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#E8ECF1' }}>
            Good morning, Emilee.
          </h1>
          <div className="text-right">
            <p style={{ color: '#5C6879' }} className="text-sm">
              {dayName}
            </p>
            <p style={{ color: '#7A8997' }} className="text-base font-medium">
              {dateStr}
            </p>
          </div>
        </div>

        {/* Sandy Panel */}
        <div className="mb-8 p-6 rounded-lg border" style={{
          backgroundColor: '#0F1219',
          borderColor: '#1E2430',
        }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: '#E8ECF1' }}>
                Sandy
              </h2>
              <p className="text-sm" style={{ color: '#5C6879' }}>
                Chief of Staff
              </p>
            </div>
          </div>

          <p className="mb-4" style={{ color: '#E8ECF1', lineHeight: '1.6' }}>
            Morning Emilee. Here's what needs your attention today:
          </p>

          <ul className="space-y-2 mb-6" style={{ color: '#E8ECF1' }}>
            <li className="text-sm">✓ {briefingStats.approvalsWaiting} approvals waiting</li>
            <li className="text-sm">✓ {briefingStats.deadlinesToday} deadline{briefingStats.deadlinesToday !== 1 ? 's' : ''} today</li>
            <li className="text-sm">✓ {briefingStats.tasksInProgress} tasks in progress across the team</li>
          </ul>

          <div className="flex gap-3">
            <input
              type="text"
              value={sandyInput}
              onChange={(e) => setSandyInput(e.target.value)}
              placeholder="Ask Sandy anything..."
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: '#0A0E14',
                borderColor: '#1E2430',
                border: '1px solid',
                color: '#E8ECF1',
              }}
            />
            <button
              className="px-6 py-2 rounded-lg font-medium transition-all text-sm"
              style={{
                backgroundColor: '#F97031',
                color: 'white',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E85E1F')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F97031')}
            >
              Send
            </button>
          </div>

          <button
            className="mt-3 text-sm font-medium transition-all"
            style={{ color: '#F97031' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Full Briefing →
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Today's Focus */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              TODAY'S FOCUS
            </h3>
            <div className="space-y-3">
              {todaysFocus.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: '#0F1219',
                    borderColor: getStatusColor(task.status),
                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: '#E8ECF1' }}>
                    {task.status === 'waiting-john' ? '🔴' : task.status === 'in-progress' ? '🟠' : '🟡'} {task.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#5C6879' }}>
                    {BRANDS[task.brand].shortName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting for Approval (Waiting for John) */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              WAITING FOR APPROVAL
            </h3>
            <div className="space-y-3">
              {waitingForJohnTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: '#0F1219',
                    borderColor: '#1E2430',
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: '#E8ECF1' }}>
                    {task.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                    Waiting for John
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Status */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              TEAM STATUS
            </h3>
            <div className="space-y-3">
              {busyTeam.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: '#0F1219',
                    borderColor: '#1E2430',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                      {employee.emoji} {employee.name.split(' ')[0]}
                    </p>
                    <span style={{ color: getStatusColor(employee.status) }}>
                      {getStatusDot(employee.status)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#5C6879' }}>
                    {employee.currentTask || 'Available'}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: '#1E2430' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${employee.workload}%`,
                        background: 'linear-gradient(90deg, #F97031, #FFB067)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
