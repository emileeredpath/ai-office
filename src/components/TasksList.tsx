import { useState, useMemo } from 'react';
import { REAL_TASKS, BRANDS, EMPLOYEES, BrandId, BRAND_ORDER } from '@/data/mtechEmployees';

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
        return '#5C6879';
      case 'backlog':
        return '#5C6879';
      case 'assigned':
        return '#3B82F6';
      case 'waiting-approval':
        return '#F97031';
      default:
        return '#5C6879';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F97031';
      case 'low':
        return '#5C6879';
      default:
        return '#5C6879';
    }
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return 'Unassigned';
    const employee = Object.values(EMPLOYEES).find((e) => e.id === ownerId);
    return employee ? `${employee.emoji} ${employee.name.split(' ')[0]}` : 'Unknown';
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#070A0F' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#E8ECF1' }}>
            All Tasks
          </h1>
          <p style={{ color: '#5C6879' }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} • {statusCounts['waiting-john']} waiting for John
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#0F1219', borderColor: '#1E2430', border: '1px solid' }}>
            <p className="text-xs" style={{ color: '#5C6879' }}>Waiting for John</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#F59E0B' }}>{statusCounts['waiting-john']}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#0F1219', borderColor: '#1E2430', border: '1px solid' }}>
            <p className="text-xs" style={{ color: '#5C6879' }}>In Progress</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#1D9E75' }}>{statusCounts['in-progress']}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#0F1219', borderColor: '#1E2430', border: '1px solid' }}>
            <p className="text-xs" style={{ color: '#5C6879' }}>Complete</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#5C6879' }}>{statusCounts['complete']}</p>
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
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
                border: '1px solid',
                color: '#E8ECF1',
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
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
                border: '1px solid',
                color: '#E8ECF1',
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
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
                border: '1px solid',
                color: '#E8ECF1',
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
            <div className="p-8 text-center" style={{ backgroundColor: '#0F1219', borderColor: '#1E2430', border: '1px solid', borderRadius: '8px' }}>
              <p style={{ color: '#5C6879' }}>No tasks match your filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: '#0F1219',
                  borderColor: '#1E2430',
                  border: '1px solid',
                  borderLeftColor: getStatusColor(task.status),
                  borderLeftWidth: task.status === 'complete' ? '1px' : '4px',
                  opacity: task.status === 'complete' ? 0.6 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" style={{ color: '#E8ECF1' }}>
                          {task.title}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: '#5C6879' }}>
                          {BRANDS[task.brand].shortName} • {task.context}
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
                        <span style={{ color: '#7A8997' }}>
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
      </div>
    </div>
  );
}
