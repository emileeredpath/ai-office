import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { Brand, TaskStatus } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_COLOR } from '@/utils/brandColors';

type FilterBrand = Brand | 'all';
type FilterStatus = TaskStatus | 'all';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

export function MyTasksScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const { isEditor } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const [filterBrand, setFilterBrand] = useState<FilterBrand>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['uncategorized']));

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Calculate summary counts
  const summaryStats = useMemo(() => {
    const allTasks = tasks.filter((task) => {
      if (filterBrand !== 'all' && task.brand !== filterBrand) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    });

    const now = new Date();
    const inProgress = allTasks.filter((t) => t.status === 'in-progress').length;
    const notStarted = allTasks.filter((t) => t.status === 'not-started').length;
    const completed = allTasks.filter((t) => t.status === 'complete').length;
    const overdue = allTasks.filter((t) => t.deadline && new Date(t.deadline) < now && t.status !== 'complete').length;

    return { inProgress, notStarted, completed, overdue };
  }, [tasks, filterBrand, filterStatus, filterPriority]);

  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (filterBrand !== 'all' && task.brand !== filterBrand) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    });

    const groups: Record<string, typeof tasks> = {};

    filtered.forEach((task) => {
      const key = task.campaignId || 'uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [tasks, filterBrand, filterStatus, filterPriority]);

  // Sort: "No Campaign" first, then active campaigns, then completed campaigns
  const sortedGroupEntries = useMemo(() => {
    const entries = Object.entries(groupedTasks);
    return entries.sort(([keyA], [keyB]) => {
      if (keyA === 'uncategorized') return -1;
      if (keyB === 'uncategorized') return 1;

      const campaignA = campaigns.find((c) => c.id === keyA);
      const campaignB = campaigns.find((c) => c.id === keyB);

      if (campaignA?.status === 'completed' && campaignB?.status !== 'completed') return 1;
      if (campaignA?.status !== 'completed' && campaignB?.status === 'completed') return -1;

      return 0;
    });
  }, [groupedTasks, campaigns]);

  const getGroupLabel = (key: string): string => {
    if (key === 'uncategorized') return 'No Campaign';
    return campaigns.find((c) => c.id === key)?.name || key;
  };

  const getGroupBrand = (key: string): Brand | null => {
    if (key === 'uncategorized') return null;
    return campaigns.find((c) => c.id === key)?.brand || null;
  };

  const isCampaignCompleted = (key: string): boolean => {
    if (key === 'uncategorized') return false;
    return campaigns.find((c) => c.id === key)?.status === 'completed';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">My Tasks</h1>
          {isEditor && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Add task
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{summaryStats.inProgress}</div>
            <div className="text-xs text-text-secondary">In Progress</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{summaryStats.notStarted}</div>
            <div className="text-xs text-text-secondary">Not Started</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{summaryStats.completed}</div>
            <div className="text-xs text-text-secondary">Completed</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold" style={{ color: summaryStats.overdue > 0 ? '#ef4444' : 'var(--text-primary)' }}>
              {summaryStats.overdue}
            </div>
            <div className="text-xs text-text-secondary">Overdue</div>
          </div>
        </div>

        {/* Orange Divider */}
        <div style={{ height: '3px', backgroundColor: '#ff9d3d', marginBottom: '2rem' }} />

        {/* Filters */}
        <div className="card mb-6">
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
          </div>
        </div>

        {/* Campaign Groups */}
        <div className="space-y-3">
          {sortedGroupEntries.map(([groupKey, groupTasks]) => {
            const isExpanded = expandedGroups.has(groupKey);
            const isCompleted = isCampaignCompleted(groupKey);
            const brand = getGroupBrand(groupKey);
            const brandColor = brand ? BRAND_COLOR[brand] : '#666';

            return (
              <div key={groupKey} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${brandColor}` }}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center gap-2 text-left transition-colors"
                  style={{ padding: '1rem 1.25rem', backgroundColor: isCompleted ? 'var(--color-surface)' : 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCompleted ? 'var(--color-surface)' : 'transparent'}
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <h2 className="text-base font-semibold text-text-primary" style={{ margin: 0 }}>
                    {getGroupLabel(groupKey)}
                  </h2>
                  <span className="text-sm text-text-secondary">({groupTasks.length})</span>
                </button>
                {isExpanded && (
                  <table className="table" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <tbody>
                      {groupTasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

          {sortedGroupEntries.length === 0 && (
            <p className="text-text-secondary">No tasks found matching your filters</p>
          )}
        </div>
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
