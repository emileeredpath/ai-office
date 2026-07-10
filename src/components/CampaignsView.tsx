import { useState, useMemo } from 'react';
import type { Employee, Task } from '@/types/employee';
import { useOfficeStore } from '@/store/officeStore';
import { ROLE_DISPLAY_NAMES } from '@/components/officeview/OfficeProps';

interface CampaignData {
  name: string;
  createdAt?: string;
  tasks: Task[];
  teamMembers: Set<string>;
}

interface CampaignStats {
  totalActive: number;
  totalInProgress: number;
  completedThisWeek: number;
  totalOverdue: number;
}

export function CampaignsView() {
  const employees = useOfficeStore((state) => state.employees);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const assignTask = useOfficeStore((state) => state.assignTask);

  // Load task notes from localStorage
  useState(() => {
    const savedNotes = localStorage.getItem('task-notes');
    if (savedNotes) {
      setTaskNotes(JSON.parse(savedNotes));
    }
  });

  const campaigns = useMemo(() => {
    const campaignMap: Record<string, CampaignData> = {};

    employees.forEach((emp) => {
      emp.tasks.forEach((task) => {
        const campaignName = task.campaign || 'Unassigned';
        if (!campaignMap[campaignName]) {
          campaignMap[campaignName] = {
            name: campaignName,
            tasks: [],
            teamMembers: new Set(),
          };
        }
        campaignMap[campaignName].tasks.push(task);
        campaignMap[campaignName].teamMembers.add(emp.id);
      });
    });

    return Object.values(campaignMap);
  }, [employees]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stats: CampaignStats = {
      totalActive: 0,
      totalInProgress: 0,
      completedThisWeek: 0,
      totalOverdue: 0,
    };

    campaigns.forEach((campaign) => {
      const hasIncomplete = campaign.tasks.some(t => t.status !== 'complete');
      if (hasIncomplete) {
        stats.totalActive++;
      }

      campaign.tasks.forEach((task) => {
        if (task.status === 'in_progress') {
          stats.totalInProgress++;
        }
        if (
          task.status === 'complete' &&
          task.completedAt &&
          new Date(task.completedAt) > weekAgo
        ) {
          stats.completedThisWeek++;
        }
      });
    });

    return stats;
  }, [campaigns]);

  const activeCampaigns = campaigns.filter((c) =>
    c.tasks.some((t) => t.status !== 'complete')
  );

  const archivedCampaigns = campaigns.filter((c) =>
    c.tasks.every((t) => t.status === 'complete')
  );

  const handleStatusChange = (taskId: string, newStatus: string) => {
    for (const emp of employees) {
      const task = emp.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = newStatus as any;
        task.updatedAt = new Date().toISOString();
        if (newStatus === 'complete') {
          task.completedAt = new Date().toISOString();
        }
        assignTask(emp.id, task);
        return;
      }
    }
  };

  const handleNotesChange = (taskId: string, notes: string) => {
    const newNotes = { ...taskNotes, [taskId]: notes };
    setTaskNotes(newNotes);
    localStorage.setItem('task-notes', JSON.stringify(newNotes));
  };

  const handleCompleteCampaign = (campaignName: string) => {
    const campaign = campaigns.find((c) => c.name === campaignName);
    if (!campaign) return;

    campaign.tasks.forEach((task) => {
      if (task.status !== 'complete') {
        const now = new Date().toISOString();
        task.status = 'complete';
        task.updatedAt = now;
        task.completedAt = now;

        const emp = employees.find((e) => e.tasks.some((t) => t.id === task.id));
        if (emp) {
          assignTask(emp.id, task);
        }
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-50">
      {/* Summary Stats */}
      <div className="px-8 py-6 border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Campaigns</h1>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-500">{stats.totalActive}</div>
              <div className="text-sm text-slate-400">Active campaigns</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.totalInProgress}</div>
              <div className="text-sm text-slate-400">In progress</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500">{stats.completedThisWeek}</div>
              <div className="text-sm text-slate-400">Completed this week</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-500">{stats.totalOverdue}</div>
              <div className="text-sm text-slate-400">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Active Campaigns */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-slate-100">Active Campaigns</h2>
            {activeCampaigns.length === 0 ? (
              <p className="text-slate-400">No active campaigns.</p>
            ) : (
              <div className="space-y-3">
                {activeCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.name}
                    campaign={campaign}
                    employees={employees}
                    isExpanded={expandedCampaign === campaign.name}
                    onToggleExpand={() =>
                      setExpandedCampaign(
                        expandedCampaign === campaign.name ? null : campaign.name
                      )
                    }
                    taskNotes={taskNotes}
                    onNotesChange={handleNotesChange}
                    onStatusChange={handleStatusChange}
                    onCompleteCampaign={handleCompleteCampaign}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Archived Campaigns */}
          {archivedCampaigns.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-3 text-slate-100">Archived</h2>
              <div className="space-y-2">
                {archivedCampaigns.map((campaign) => (
                  <div
                    key={campaign.name}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-400"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-300">{campaign.name}</div>
                        <div>{campaign.tasks.length} tasks completed</div>
                      </div>
                      <div className="text-xs">✓ Completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CampaignCardProps {
  campaign: CampaignData;
  employees: Employee[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  taskNotes: Record<string, string>;
  onNotesChange: (taskId: string, notes: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onCompleteCampaign: (campaignName: string) => void;
}

function CampaignCard({
  campaign,
  employees,
  isExpanded,
  onToggleExpand,
  taskNotes,
  onNotesChange,
  onStatusChange,
  onCompleteCampaign,
}: CampaignCardProps) {
  const completed = campaign.tasks.filter((t) => t.status === 'complete').length;
  const total = campaign.tasks.length;
  const progress = (completed / total) * 100;

  // Determine status
  let status = 'Active';
  if (completed === total) {
    status = 'Complete';
  } else {
    const lastUpdate = Math.max(...campaign.tasks.map((t) => new Date(t.updatedAt).getTime()));
    const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 5) status = 'Stalled';
  }

  // Get team member initials
  const memberInitials = Array.from(campaign.teamMembers)
    .map((empId) => {
      const emp = employees.find((e) => e.id === empId);
      return emp ? ROLE_DISPLAY_NAMES[emp.id]?.slice(0, 1) || '?' : '?';
    })
    .slice(0, 3);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-slate-100">{campaign.name}</h3>
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              status === 'Complete'
                ? 'bg-green-900 text-green-200'
                : status === 'Stalled'
                ? 'bg-red-900 text-red-200'
                : 'bg-orange-900 text-orange-200'
            }`}>
              {status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">
                  {completed} of {total} tasks
                </span>
                <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {memberInitials.map((initial, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300"
                >
                  {initial}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-4 text-slate-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>

      {isExpanded && (
        <CampaignDetails
          campaign={campaign}
          employees={employees}
          taskNotes={taskNotes}
          onNotesChange={onNotesChange}
          onStatusChange={onStatusChange}
          onCompleteCampaign={() => onCompleteCampaign(campaign.name)}
        />
      )}
    </div>
  );
}

interface CampaignDetailsProps {
  campaign: CampaignData;
  employees: Employee[];
  taskNotes: Record<string, string>;
  onNotesChange: (taskId: string, notes: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onCompleteCampaign: () => void;
}

function CampaignDetails({
  campaign,
  employees,
  taskNotes,
  onNotesChange,
  onStatusChange,
  onCompleteCampaign,
}: CampaignDetailsProps) {
  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'awaiting_brief', label: 'Awaiting Brief' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_review', label: 'Waiting for Review' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'complete', label: 'Complete' },
  ];

  const getEmployeeName = (taskId: string) => {
    for (const emp of employees) {
      if (emp.tasks.some((t) => t.id === taskId)) {
        return emp.name;
      }
    }
    return 'Unknown';
  };

  const getProjectUrl = (empId: string) => {
    return localStorage.getItem(`claude_project_url_${empId}`);
  };

  return (
    <div className="border-t border-slate-700 bg-slate-900 p-4 space-y-3">
      {campaign.tasks.map((task) => {
        const employeeId = Array.from(campaign.teamMembers).find((empId) =>
          employees
            .find((e) => e.id === empId)
            ?.tasks.some((t) => t.id === task.id)
        ) || '';

        const projectUrl = getProjectUrl(employeeId);

        return (
          <div key={task.id} className="bg-slate-800 border border-slate-700 rounded p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-100 truncate">{task.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {projectUrl ? (
                    <button
                      onClick={() => window.open(projectUrl, '_blank')}
                      className="text-orange-500 hover:underline"
                    >
                      {getEmployeeName(task.id)} ↗
                    </button>
                  ) : (
                    <span>{getEmployeeName(task.id)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  task.priority === 'high'
                    ? 'bg-red-900 text-red-200'
                    : task.priority === 'medium'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-green-900 text-green-200'
                }`}>
                  {task.priority}
                </span>

                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value)}
                  className="bg-slate-700 text-slate-100 text-xs px-2 py-1 rounded border border-slate-600"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              type="text"
              value={taskNotes[task.id] || ''}
              onChange={(e) => onNotesChange(task.id, e.target.value)}
              placeholder="Add notes..."
              className="w-full bg-slate-700 text-slate-100 text-xs px-2 py-1 rounded border border-slate-600 placeholder-slate-500"
            />
          </div>
        );
      })}

      <button
        onClick={onCompleteCampaign}
        className="w-full mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors"
      >
        Complete Campaign
      </button>
    </div>
  );
}
