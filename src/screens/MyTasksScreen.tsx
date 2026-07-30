import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { Brand, TaskStatus } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';

type FilterBrand = Brand | 'all';
type FilterStatus = TaskStatus | 'all';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

export function MyTasksScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const { isEditor } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const [filterBrand, setFilterBrand] = useState<FilterBrand>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [groupBy, setGroupBy] = useState<'status' | 'brand' | 'campaign' | 'priority'>('status');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterBrand !== 'all' && task.brand !== filterBrand) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterBrand, filterStatus, filterPriority]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof tasks> = {};

    filteredTasks.forEach((task) => {
      let key: string;

      if (groupBy === 'status') {
        key = task.status;
      } else if (groupBy === 'brand') {
        key = task.brand;
      } else if (groupBy === 'priority') {
        key = task.priority;
      } else {
        key = task.campaignId || 'uncategorized';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [filteredTasks, groupBy]);

  // When grouping by status, order sections deliberately — in-progress work
  // up top where it's actionable, completed tasks pushed to the bottom —
  // rather than whatever order statuses happened to first appear in the data.
  const STATUS_GROUP_ORDER: TaskStatus[] = [
    'in-progress',
    'waiting-approval',
    'waiting-john',
    'waiting-customer',
    'approved-ready',
    'not-started',
    'backlog',
    'blocked',
    'complete',
  ];

  const sortedGroupEntries = useMemo(() => {
    const entries = Object.entries(groupedTasks);
    if (groupBy !== 'status') return entries;
    return entries.sort(
      ([a], [b]) => STATUS_GROUP_ORDER.indexOf(a as TaskStatus) - STATUS_GROUP_ORDER.indexOf(b as TaskStatus)
    );
  }, [groupedTasks, groupBy]);

  const statusLabels: Record<string, string> = {
    'backlog': 'Backlog',
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'waiting-approval': 'Waiting Approval',
    'waiting-john': 'Waiting for John',
    'waiting-customer': 'Waiting Customer',
    'approved-ready': 'Approved Ready',
    'blocked': 'Blocked',
    'complete': 'Complete',
  };

  const brandLabels: Record<string, string> = {
    'mtech': 'MTech',
    'brentwood': 'Brentwood',
    'radio-links': 'Radio Links',
    'capcom': 'Capcom',
    'ircl': 'IRCL',
    'idaro': 'IDARO',
  };

  const priorityLabels: Record<string, string> = {
    'high': 'High Priority',
    'medium': 'Medium Priority',
    'low': 'Low Priority',
  };

  const getGroupLabel = (key: string): string => {
    if (groupBy === 'status') return statusLabels[key] || key;
    if (groupBy === 'brand') return brandLabels[key] || key;
    if (groupBy === 'priority') return priorityLabels[key] || key;
    return key === 'uncategorized' ? 'No Campaign' : `Campaign: ${key}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">My Tasks</h1>
          {isEditor && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Add task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value as FilterBrand)}
              className="input flex-1 min-w-[150px]"
            >
              <option value="all">All brands</option>
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
              <option value="idaro">IDARO</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="input flex-1 min-w-[150px]"
            >
              <option value="all">All statuses</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-approval">Waiting Approval</option>
              <option value="waiting-john">Waiting for John</option>
              <option value="waiting-customer">Waiting Customer</option>
              <option value="approved-ready">Approved Ready</option>
              <option value="blocked">Blocked</option>
              <option value="complete">Complete</option>
              <option value="backlog">Backlog</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="input flex-1 min-w-[150px]"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="input flex-1 min-w-[150px]"
            >
              <option value="status">Group by status</option>
              <option value="brand">Group by brand</option>
              <option value="campaign">Group by campaign</option>
              <option value="priority">Group by priority</option>
            </select>
          </div>
        </div>

        {/* Task Groups */}
        <div className="space-y-6">
          {sortedGroupEntries.map(([groupKey, groupTasks]) => (
            <div key={groupKey}>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                {getGroupLabel(groupKey)} ({groupTasks.length})
              </h2>
              <div className="card">
                <table className="table">
                  <tbody>
                    {groupTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {sortedGroupEntries.length === 0 && (
            <p className="text-text-secondary">No tasks found matching your filters</p>
          )}
        </div>
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
