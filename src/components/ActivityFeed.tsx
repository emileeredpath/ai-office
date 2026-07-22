import { useMemo } from 'react';
import { REAL_TASKS, EMPLOYEES } from '@/data/mtechEmployees';
import { useCompletedTasks } from '@/contexts/CompletedTasksContext';

interface Activity {
  id: string;
  type: 'task_completed' | 'task_assigned' | 'task_started' | 'approval_pending' | 'deadline_approaching';
  user: string;
  action: string;
  timestamp: Date;
  icon: string;
}

export function ActivityFeed() {
  const { completedTasks } = useCompletedTasks();

  const activities = useMemo(() => {
    const acts: Activity[] = [];
    const now = new Date();

    // Simulate recent activities based on task data
    REAL_TASKS.forEach((task, index) => {
      const employee = Object.values(EMPLOYEES).find((e) => e.id === task.owner);
      if (!employee) return;

      // Task assignments (spaced out in time)
      acts.push({
        id: `assign-${task.id}`,
        type: 'task_assigned',
        user: employee.name,
        action: `Assigned to work on "${task.title}"`,
        timestamp: new Date(now.getTime() - (index + 1) * 3600000),
        icon: '📋',
      });

      // In progress tasks
      if (task.status === 'in-progress') {
        acts.push({
          id: `start-${task.id}`,
          type: 'task_started',
          user: employee.name,
          action: `Started working on "${task.title}"`,
          timestamp: new Date(now.getTime() - (index + 2) * 3600000),
          icon: '🚀',
        });
      }

      // Waiting for approval
      if (task.status === 'waiting-john') {
        acts.push({
          id: `approve-${task.id}`,
          type: 'approval_pending',
          user: 'John',
          action: `Needs to review "${task.title}"`,
          timestamp: new Date(now.getTime() - (index + 3) * 3600000),
          icon: '⏳',
        });
      }

      // Completed tasks
      if (completedTasks.has(task.id)) {
        acts.push({
          id: `complete-${task.id}`,
          type: 'task_completed',
          user: employee.name,
          action: `Completed "${task.title}"`,
          timestamp: new Date(now.getTime() - (index + 4) * 3600000),
          icon: '✅',
        });
      }

      // Upcoming deadlines
      if (task.deadline) {
        const daysUntil = Math.ceil((new Date(task.deadline).getTime() - now.getTime()) / 86400000);
        if (daysUntil <= 3 && daysUntil > 0) {
          acts.push({
            id: `deadline-${task.id}`,
            type: 'deadline_approaching',
            user: employee.name,
            action: `"${task.title}" due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            timestamp: new Date(now.getTime() - (index + 5) * 3600000),
            icon: '⏰',
          });
        }
      }
    });

    return acts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
  }, [completedTasks]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Activity Feed
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-8">
          Real-time updates from your team
        </p>

        <div className="space-y-3 max-w-2xl">
          {activities.length === 0 ? (
            <div className="p-8 text-center rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
              >
                <div className="flex items-start gap-4">
                  <div style={{ fontSize: '20px' }}>{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {activity.user} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>{activity.action}</span>
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
