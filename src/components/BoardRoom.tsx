import { useMemo } from 'react';
import { REAL_TASKS, EMPLOYEES, BRANDS } from '@/data/mtechEmployees';

interface BoardRoomProps {
  companyId: string;
  currentUserId: string;
}

export function BoardRoom({ companyId, currentUserId }: BoardRoomProps) {
  const metrics = useMemo(() => {
    const totalTasks = REAL_TASKS.length;
    const completedTasks = REAL_TASKS.filter((t) => t.status === 'complete').length;
    const inProgressTasks = REAL_TASKS.filter((t) => t.status === 'in-progress').length;
    const waitingForJohn = REAL_TASKS.filter((t) => t.status === 'waiting-john').length;
    const highPriorityTasks = REAL_TASKS.filter((t) => t.priority === 'high').length;
    const highPriorityComplete = REAL_TASKS.filter((t) => t.priority === 'high' && t.status === 'complete').length;
    const overdueTasks = REAL_TASKS.filter((t) => t.deadline && new Date(t.deadline) < new Date()).length;

    const teamBusyCount = Object.values(EMPLOYEES).filter((e) => e.status === 'busy').length;
    const avgWorkload = Math.round(
      Object.values(EMPLOYEES).reduce((sum, e) => sum + e.workload, 0) / Object.values(EMPLOYEES).length
    );

    const brandMetrics: Record<string, { total: number; complete: number }> = {};
    Object.entries(BRANDS).forEach(([key, brand]) => {
      const tasks = REAL_TASKS.filter((t) => t.brand === key);
      brandMetrics[brand.shortName] = {
        total: tasks.length,
        complete: tasks.filter((t) => t.status === 'complete').length,
      };
    });

    const criticalIssues: string[] = [];
    if (waitingForJohn > 2) criticalIssues.push(`${waitingForJohn} items awaiting John's review`);
    if (overdueTasks > 0) criticalIssues.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
    if (avgWorkload > 75) criticalIssues.push(`Team workload at ${avgWorkload}% - consider load balancing`);

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round((completedTasks / totalTasks) * 100),
      inProgressTasks,
      waitingForJohn,
      highPriorityTasks,
      highPriorityComplete,
      highPriorityRate: Math.round((highPriorityComplete / highPriorityTasks) * 100) || 0,
      teamBusyCount,
      avgWorkload,
      overdueTasks,
      brandMetrics,
      criticalIssues,
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Board Room
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Weekly management reporting & strategic overview
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Task Completion
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#1D9E75' }}>
              {metrics.completionRate}%
            </p>
            <p className="text-xs mt-1" style={{ color: '#7A8997' }}>
              {metrics.completedTasks}/{metrics.totalTasks}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              In Progress
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#F97031' }}>
              {metrics.inProgressTasks}
            </p>
            <p className="text-xs mt-1" style={{ color: '#7A8997' }}>
              Active tasks
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {metrics.overdueTasks > 0 ? 'URGENT: Overdue' : 'Awaiting Review'}
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: metrics.overdueTasks > 0 ? '#EF4444' : '#F59E0B' }}>
              {metrics.overdueTasks > 0 ? metrics.overdueTasks : metrics.waitingForJohn}
            </p>
            <p className="text-xs mt-1" style={{ color: '#7A8997' }}>
              {metrics.overdueTasks > 0 ? 'Overdue tasks' : 'Waiting for John'}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Team Capacity
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: metrics.avgWorkload > 75 ? '#EF4444' : '#3B82F6' }}>
              {metrics.avgWorkload}%
            </p>
            <p className="text-xs mt-1" style={{ color: '#7A8997' }}>
              Avg workload
            </p>
          </div>
        </div>

        {/* Critical Issues Alert */}
        {metrics.criticalIssues.length > 0 && (
          <div className="p-4 mb-8 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444', border: '1px solid' }}>
            <p style={{ color: '#EF4444', fontWeight: '600', marginBottom: '8px' }}>
              ⚠️ Critical Issues
            </p>
            <div className="space-y-2">
              {metrics.criticalIssues.map((issue, i) => (
                <p key={i} style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                  • {issue}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* High Priority Focus */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              High Priority Tasks
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: '#7A8997' }}>Total High Priority</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {metrics.highPriorityTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#7A8997' }}>Completed</span>
                <span style={{ color: '#1D9E75', fontWeight: 'bold' }}>
                  {metrics.highPriorityComplete}
                </span>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: '#7A8997', fontSize: '0.75rem' }}>Completion Rate</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {metrics.highPriorityRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${metrics.highPriorityRate}%`,
                      background: 'linear-gradient(90deg, #EF4444, #FCA5A5)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Status */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Team Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: '#7A8997' }}>Total Team Members</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {Object.keys(EMPLOYEES).length - 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#7A8997' }}>Currently Busy</span>
                <span style={{ color: '#F97031', fontWeight: 'bold' }}>
                  {metrics.teamBusyCount}
                </span>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.6' }}>
                  Team is performing well. Average workload at {metrics.avgWorkload}% capacity. Consider load balancing if approaching 80%+.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Performance */}
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Performance by Brand
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics.brandMetrics)
              .filter(([_, data]) => data.total > 0)
              .map(([brand, data]) => {
                const rate = Math.round((data.complete / data.total) * 100);
                return (
                  <div key={brand}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                        {brand}
                      </span>
                      <span style={{ color: '#7A8997', fontSize: '0.875rem' }}>
                        {data.complete}/{data.total} ({rate}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${rate}%`,
                          background: 'linear-gradient(90deg, #F97031, #FFB067)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
