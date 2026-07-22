import { useState, useMemo } from 'react';
import { REAL_TASKS, EMPLOYEES } from '@/data/mtechEmployees';
import { useCompletedTasks } from '@/contexts/CompletedTasksContext';

interface TasksGroupedByStatus {
  'backlog': typeof REAL_TASKS;
  'assigned': typeof REAL_TASKS;
  'in-progress': typeof REAL_TASKS;
  'waiting-review': typeof REAL_TASKS;
  'waiting-approval': typeof REAL_TASKS;
  'waiting-john': typeof REAL_TASKS;
  'waiting-customer': typeof REAL_TASKS;
  'blocked': typeof REAL_TASKS;
  'complete': typeof REAL_TASKS;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'backlog': { bg: 'rgba(122, 137, 151, 0.1)', text: '#7A8997', badge: 'bg-gray-500' },
  'assigned': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', badge: 'bg-blue-500' },
  'in-progress': { bg: 'rgba(29, 158, 117, 0.1)', text: '#1D9E75', badge: 'bg-green-500' },
  'waiting-review': { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', badge: 'bg-yellow-500' },
  'waiting-approval': { bg: 'rgba(249, 112, 31, 0.1)', text: '#F97031', badge: 'bg-orange-500' },
  'waiting-john': { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', badge: 'bg-yellow-600' },
  'waiting-customer': { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899', badge: 'bg-pink-500' },
  'blocked': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', badge: 'bg-red-500' },
  'complete': { bg: 'rgba(122, 137, 151, 0.1)', text: '#7A8997', badge: 'bg-gray-400' },
};

const STATUS_LABELS: Record<string, string> = {
  'backlog': 'Backlog',
  'assigned': 'Assigned',
  'in-progress': 'In Progress',
  'waiting-review': 'Waiting Review',
  'waiting-approval': 'Awaiting Approval',
  'waiting-john': 'Waiting for John',
  'waiting-customer': 'Waiting Customer',
  'blocked': 'Blocked',
  'complete': 'Complete',
};

const PRIORITY_LABELS: Record<string, string> = {
  'high': '🔴 High',
  'medium': '🟡 Medium',
  'low': '🟢 Low',
};

export function AllTasksList() {
  const [expandedStatus, setExpandedStatus] = useState<string>('in-progress');
  const [searchQuery, setSearchQuery] = useState('');
  const { isTaskComplete, toggleTaskComplete } = useCompletedTasks();

  const groupedTasks = useMemo(() => {
    const grouped: Partial<TasksGroupedByStatus> = {};

    Object.keys(STATUS_LABELS).forEach((status) => {
      grouped[status as keyof TasksGroupedByStatus] = REAL_TASKS.filter((t) => t.status === status);
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      Object.keys(grouped).forEach((status) => {
        grouped[status as keyof TasksGroupedByStatus] = grouped[status as keyof TasksGroupedByStatus]!.filter(
          (t) => t.title.toLowerCase().includes(query) || t.context.toLowerCase().includes(query)
        );
      });
    }

    return grouped as TasksGroupedByStatus;
  }, [searchQuery]);

  const totalTasks = Object.values(groupedTasks).reduce((sum, tasks) => sum + tasks.length, 0);
  const completeTasks = groupedTasks.complete.length;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: '#EF4444' };
      case 'medium':
        return { color: '#F97031' };
      case 'low':
        return { color: '#7A8997' };
      default:
        return { color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            📋 All Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {completeTasks}/{totalTasks} complete • {totalTasks} total
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              border: '1px solid',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Task Groups */}
        <div className="space-y-4">
          {Object.entries(STATUS_LABELS).map(([statusKey, statusLabel]) => {
            const tasks = groupedTasks[statusKey as keyof TasksGroupedByStatus];
            if (tasks.length === 0) return null;

            const isExpanded = expandedStatus === statusKey;
            const colors = STATUS_COLORS[statusKey];

            return (
              <div key={statusKey} className="rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                {/* Status Header */}
                <button
                  onClick={() => setExpandedStatus(isExpanded ? '' : statusKey)}
                  className="w-full p-4 flex items-center justify-between transition-all"
                  style={{ backgroundColor: colors.bg }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>
                      {statusLabel}
                    </span>
                    <span
                      style={{
                        backgroundColor: colors.text,
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {tasks.length}
                    </span>
                  </div>
                  <span style={{ color: colors.text, fontSize: '16px' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {/* Task List */}
                {isExpanded && (
                  <div
                    className="space-y-2 p-4"
                    style={{
                      borderTop: '1px solid',
                      borderColor: 'var(--border-color)',
                      maxHeight: '500px',
                      overflowY: 'auto',
                    }}
                  >
                    {tasks.map((task) => {
                      const owner = task.owner ? Object.values(EMPLOYEES).find((e) => e.id === task.owner) : null;
                      const isComplete = isTaskComplete(task.id);

                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded transition-all group"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            opacity: isComplete ? 0.6 : 1,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isComplete}
                              onChange={() => toggleTaskComplete(task.id)}
                              className="w-4 h-4 mt-1 cursor-pointer flex-shrink-0"
                              style={{ accentColor: 'var(--accent-orange)' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                style={{
                                  color: 'var(--text-primary)',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  marginBottom: '4px',
                                  textDecoration: isComplete ? 'line-through' : 'none',
                                  wordWrap: 'break-word',
                                }}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span style={{ ...getPriorityStyle(task.priority), fontSize: '12px' }}>
                                  {PRIORITY_LABELS[task.priority]}
                                </span>
                                {owner && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {owner.emoji} {owner.name.split(' ')[0]}
                                  </span>
                                )}
                                {task.deadline && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    📅 {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalTasks === 0 && (
          <div className="p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
