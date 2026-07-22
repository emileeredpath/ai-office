import { useState, useMemo } from 'react';
import { REAL_TASKS, BRANDS, EMPLOYEES, BrandId, BRAND_ORDER } from '@/data/mtechEmployees';
import { TaskDetailPanel } from './TaskDetailPanel';
import { ProjectDetail } from './ProjectDetail';
import { TeamMemberProfile } from './TeamMemberProfile';
import { useCompletedTasks } from '@/contexts/CompletedTasksContext';

interface TasksListProps {
  companyId: string;
  currentUserId: string;
}

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

export function TasksList({ companyId, currentUserId }: TasksListProps) {
  const [selectedBrand, setSelectedBrand] = useState<BrandId | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectBrand, setSelectedProjectBrand] = useState<BrandId | null>(null);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const { isTaskComplete, toggleTaskComplete } = useCompletedTasks();

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    return REAL_TASKS.filter((task) => {
      if (selectedBrand !== 'all' && task.brand !== selectedBrand) return false;
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
      return true;
    });
  }, [selectedBrand, selectedStatus, selectedPriority]);

  // Count tasks by status
  const statusCounts = useMemo(() => {
    return {
      'waiting-john': REAL_TASKS.filter((t) => t.status === 'waiting-john').length,
      'in-progress': REAL_TASKS.filter((t) => t.status === 'in-progress').length,
      'complete': REAL_TASKS.filter((t) => t.status === 'complete').length,
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting-john':
        return '#F59E0B';
      case 'in-progress':
        return '#1D9E75';
      case 'complete':
        return 'var(--text-secondary)';
      case 'backlog':
        return 'var(--text-secondary)';
      case 'assigned':
        return '#3B82F6';
      case 'waiting-approval':
        return '#F97031';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F97031';
      case 'low':
        return 'var(--text-secondary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return 'Unassigned';
    const employee = Object.values(EMPLOYEES).find((e) => e.id === ownerId);
    return employee ? `${employee.emoji} ${employee.name.split(' ')[0]}` : 'Unknown';
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            All Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} • {statusCounts['waiting-john']} waiting for John
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Waiting for John</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#F59E0B' }}>{statusCounts['waiting-john']}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>In Progress</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#1D9E75' }}>{statusCounts['in-progress']}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Complete</p>
            <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-secondary)' }}>{statusCounts['complete']}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-6 flex-wrap">
          {/* Brand Filter */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: '#7A8997' }}>Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value as BrandId | 'all')}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                border: '1px solid',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Brands</option>
              {BRAND_ORDER.map((brandId) => {
                const brand = BRANDS[brandId];
                return (
                  <option key={brandId} value={brandId}>
                    {brand.shortName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: '#7A8997' }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                border: '1px solid',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: '#7A8997' }}>Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                border: '1px solid',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No tasks match your filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  border: '1px solid',
                  borderLeftColor: getStatusColor(task.status),
                  borderLeftWidth: isTaskComplete(task.id) ? '1px' : '4px',
                  opacity: isTaskComplete(task.id) ? 0.6 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="checkbox"
                    checked={isTaskComplete(task.id)}
                    onChange={() => toggleTaskComplete(task.id)}
                    className="w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                    style={{ accentColor: '#F97031' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold truncate"
                          style={{
                            color: 'var(--text-primary)',
                            textDecoration: isTaskComplete(task.id) ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          <span
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectBrand(task.brand);
                            }}
                          >
                            {BRANDS[task.brand].shortName}
                          </span>
                          {' '}• {task.context}
                        </p>
                      </div>
                      {task.status === 'waiting-john' && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                          }}
                        >
                          🔴 John
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs mt-3">
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${getStatusColor(task.status)}22`,
                          color: getStatusColor(task.status),
                        }}
                      >
                        {STATUS_LABELS[task.status] || task.status}
                      </span>

                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${getPriorityColor(task.priority)}22`,
                          color: getPriorityColor(task.priority),
                        }}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>

                      {task.owner && (
                        <span
                          style={{ color: '#7A8997', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeamMemberId(task.owner);
                          }}
                        >
                          {getOwnerName(task.owner)}
                        </span>
                      )}

                      {task.deadline && (
                        <span style={{ color: '#7A8997' }}>
                          Due {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            onTaskMarkedComplete={() => {
              // Trigger a refresh of the tasks list
              setSelectedTaskId(null);
            }}
          />
        )}

        {selectedProjectBrand && (
          <ProjectDetail brandId={selectedProjectBrand} onClose={() => setSelectedProjectBrand(null)} />
        )}

        {selectedTeamMemberId && (
          <TeamMemberProfile employeeId={selectedTeamMemberId} onClose={() => setSelectedTeamMemberId(null)} />
        )}
      </div>
    </div>
  );
}
