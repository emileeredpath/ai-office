import { useMemo, useState } from 'react';
import { REAL_TASKS, BRANDS, EMPLOYEES } from '@/data/mtechEmployees';

interface ProjectsListProps {
  companyId: string;
  currentUserId: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'complete';
  progress: number;
  taskCount: number;
  completedCount: number;
  teamMembers: string[];
  brands: string[];
}

export function ProjectsList({ companyId, currentUserId }: ProjectsListProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projects: Project[] = useMemo(() => {
    const projectsMap: Record<string, Project> = {
      'martyn-law': {
        id: 'martyn-law',
        name: "Martyn's Law Campaign",
        description: 'Security awareness campaign across all brands',
        status: 'in-progress',
        progress: 33,
        taskCount: 0,
        completedCount: 0,
        teamMembers: [],
        brands: [],
      },
      'account-manager-emails': {
        id: 'account-manager-emails',
        name: 'Account Manager Email Programme',
        description: 'Personalized introduction emails for key accounts',
        status: 'in-progress',
        progress: 60,
        taskCount: 0,
        completedCount: 0,
        teamMembers: [],
        brands: [],
      },
      'website-refresh': {
        id: 'website-refresh',
        name: 'Website Refresh Initiative',
        description: 'New pages and landing page updates',
        status: 'in-progress',
        progress: 50,
        taskCount: 0,
        completedCount: 0,
        teamMembers: [],
        brands: [],
      },
      'ppc-optimization': {
        id: 'ppc-optimization',
        name: 'PPC Campaign Restructure',
        description: 'Review messaging and restructure campaigns',
        status: 'in-progress',
        progress: 40,
        taskCount: 0,
        completedCount: 0,
        teamMembers: [],
        brands: [],
      },
    };

    // Assign tasks to projects
    REAL_TASKS.forEach((task) => {
      if (task.title.includes("Martyn's Law")) {
        projectsMap['martyn-law'].taskCount++;
        if (task.status === 'complete') projectsMap['martyn-law'].completedCount++;
        if (task.brand && !projectsMap['martyn-law'].brands.includes(BRANDS[task.brand].shortName)) {
          projectsMap['martyn-law'].brands.push(BRANDS[task.brand].shortName);
        }
        if (task.owner && !projectsMap['martyn-law'].teamMembers.includes(task.owner)) {
          projectsMap['martyn-law'].teamMembers.push(task.owner);
        }
      } else if (task.title.includes('Account Manager Email')) {
        projectsMap['account-manager-emails'].taskCount++;
        if (task.status === 'complete') projectsMap['account-manager-emails'].completedCount++;
        if (task.brand && !projectsMap['account-manager-emails'].brands.includes(BRANDS[task.brand].shortName)) {
          projectsMap['account-manager-emails'].brands.push(BRANDS[task.brand].shortName);
        }
        if (task.owner && !projectsMap['account-manager-emails'].teamMembers.includes(task.owner)) {
          projectsMap['account-manager-emails'].teamMembers.push(task.owner);
        }
      } else if (task.title.includes('page') || task.title.includes('Page') || task.title.includes('Banner')) {
        projectsMap['website-refresh'].taskCount++;
        if (task.status === 'complete') projectsMap['website-refresh'].completedCount++;
        if (task.brand && !projectsMap['website-refresh'].brands.includes(BRANDS[task.brand].shortName)) {
          projectsMap['website-refresh'].brands.push(BRANDS[task.brand].shortName);
        }
        if (task.owner && !projectsMap['website-refresh'].teamMembers.includes(task.owner)) {
          projectsMap['website-refresh'].teamMembers.push(task.owner);
        }
      } else if (task.title.includes('PPC')) {
        projectsMap['ppc-optimization'].taskCount++;
        if (task.status === 'complete') projectsMap['ppc-optimization'].completedCount++;
        if (task.brand && !projectsMap['ppc-optimization'].brands.includes(BRANDS[task.brand].shortName)) {
          projectsMap['ppc-optimization'].brands.push(BRANDS[task.brand].shortName);
        }
        if (task.owner && !projectsMap['ppc-optimization'].teamMembers.includes(task.owner)) {
          projectsMap['ppc-optimization'].teamMembers.push(task.owner);
        }
      }
    });

    // Calculate progress based on completed tasks
    Object.values(projectsMap).forEach((project) => {
      if (project.taskCount > 0) {
        project.progress = Math.round((project.completedCount / project.taskCount) * 100);
      }
      if (project.completedCount === project.taskCount && project.taskCount > 0) {
        project.status = 'complete';
      }
    });

    return Object.values(projectsMap).filter((p) => p.taskCount > 0);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return '#7A8997';
      case 'in-progress':
        return '#F97031';
      case 'review':
        return '#F59E0B';
      case 'complete':
        return '#1D9E75';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planning';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      case 'complete':
        return 'Complete';
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {projects.length} active project{projects.length !== 1 ? 's' : ''} • {projects.reduce((sum, p) => sum + p.taskCount, 0)} total tasks
          </p>
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          {projects.map((project) => {
            const projectTasks = REAL_TASKS.filter((t) => {
              if (project.id === 'martyn-law') return t.title.includes("Martyn's Law");
              if (project.id === 'account-manager-emails') return t.title.includes('Account Manager Email');
              if (project.id === 'website-refresh') return t.title.includes('page') || t.title.includes('Page') || t.title.includes('Banner');
              if (project.id === 'ppc-optimization') return t.title.includes('PPC');
              return false;
            });
            const hasOverdueTasks = projectTasks.some((t) => t.deadline && new Date(t.deadline) < new Date());
            const blockingTasks = projectTasks.filter((t) => t.status === 'waiting-john').length;

            return (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className="p-6 rounded-lg cursor-pointer transition-all hover:border-orange-500"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: hasOverdueTasks ? '#EF4444' : 'var(--border-color)',
                border: '1px solid',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </h3>
                    {hasOverdueTasks && (
                      <span style={{ fontSize: '16px' }} title="Has overdue tasks">
                        ⚠️
                      </span>
                    )}
                    {blockingTasks > 0 && (
                      <span style={{ fontSize: '16px' }} title={`${blockingTasks} tasks awaiting review`}>
                        🔴
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {project.description}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded text-xs font-medium flex-shrink-0"
                  style={{
                    backgroundColor: `${getStatusColor(project.status)}22`,
                    color: getStatusColor(project.status),
                  }}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs" style={{ color: '#7A8997' }}>
                    Progress
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {project.completedCount} of {project.taskCount} tasks
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      background: 'linear-gradient(90deg, #F97031, #FFB067)',
                    }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-xs">
                {project.brands.length > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="mb-1">
                      Brands
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {project.brands.map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.teamMembers.length > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="mb-1">
                      Team
                    </p>
                    <div className="flex gap-1">
                      {project.teamMembers.slice(0, 3).map((memberId) => {
                        const member = Object.values(EMPLOYEES).find((e) => e.id === memberId);
                        return (
                          <span key={memberId} title={member?.name}>
                            {member?.emoji}
                          </span>
                        );
                      })}
                      {project.teamMembers.length > 3 && (
                        <span style={{ color: '#7A8997' }}>+{project.teamMembers.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Project Detail Modal */}
        {selectedProjectId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setSelectedProjectId(null)}
          >
            <div
              className="bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const project = projects.find((p) => p.id === selectedProjectId);
                if (!project) return null;

                const projectTasks = REAL_TASKS.filter((t) => {
                  if (project.id === 'martyn-law') return t.title.includes("Martyn's Law");
                  if (project.id === 'account-manager-emails') return t.title.includes('Account Manager Email');
                  if (project.id === 'website-refresh') return t.title.includes('page') || t.title.includes('Page') || t.title.includes('Banner');
                  if (project.id === 'ppc-optimization') return t.title.includes('PPC');
                  return false;
                });

                return (
                  <>
                    <div className="sticky top-0 bg-slate-900 border-b p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {project.name}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
                        </div>
                        <button
                          onClick={() => setSelectedProjectId(null)}
                          className="text-2xl font-bold transition-all"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Project Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Status</p>
                          <p className="text-lg font-bold mt-1" style={{ color: getStatusColor(project.status) }}>
                            {getStatusLabel(project.status)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Progress</p>
                          <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                            {project.progress}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Tasks</p>
                          <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                            {project.completedCount}/{project.taskCount}
                          </p>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div>
                        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                          Project Tasks ({projectTasks.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {projectTasks.map((task) => (
                            <div key={task.id} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                              <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>{task.title}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: task.status === 'complete' ? 'rgba(29, 158, 117, 0.2)' : 'rgba(249, 112, 31, 0.2)',
                                    color: task.status === 'complete' ? '#1D9E75' : '#F97031',
                                  }}
                                >
                                  {task.status}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {Object.values(EMPLOYEES).find((e) => e.id === task.owner)?.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
