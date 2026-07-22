import { REAL_TASKS, EMPLOYEES, BRANDS, BrandId } from '@/data/mtechEmployees';
import { useCompletedTasks } from '@/contexts/CompletedTasksContext';

interface ProjectDetailProps {
  brandId: BrandId;
  onClose: () => void;
}

export function ProjectDetail({ brandId, onClose }: ProjectDetailProps) {
  const brand = BRANDS[brandId];
  const projectTasks = REAL_TASKS.filter((t) => t.brand === brandId);
  const { isTaskComplete, toggleTaskComplete } = useCompletedTasks();

  const completedCount = projectTasks.filter((t) => isTaskComplete(t.id)).length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  const teamMembers = new Set(projectTasks.map((t) => t.owner).filter(Boolean));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {brand.shortName} Campaign
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{projectTasks.length} tasks</p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl font-bold transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Progress</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{completedCount}/{projectTasks.length}</span>
          </div>
          <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #F97031, #FFB067)',
              }}
            />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {progressPercent}% complete
          </p>
        </div>

        {/* Team Members */}
        {teamMembers.size > 0 && (
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Team
            </h3>
            <div className="space-y-2">
              {Array.from(teamMembers).map((memberId) => {
                if (!memberId) return null;
                const member = Object.values(EMPLOYEES).find((e) => e.id === memberId);
                if (!member) return null;
                const memberTasks = projectTasks.filter((t) => t.owner === memberId);
                const memberCompleted = memberTasks.filter((t) => isTaskComplete(t.id)).length;
                return (
                  <div key={memberId} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text-primary)' }}>
                        {member.emoji} {member.name}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {memberCompleted}/{memberTasks.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full mt-2" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: memberTasks.length > 0 ? `${(memberCompleted / memberTasks.length) * 100}%` : '0%',
                          backgroundColor: '#1D9E75',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="p-6">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Tasks
          </h3>
          <div className="space-y-2">
            {projectTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded flex items-center gap-3"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <input
                  type="checkbox"
                  checked={isTaskComplete(task.id)}
                  onChange={() => toggleTaskComplete(task.id)}
                  className="w-5 h-5 cursor-pointer"
                  style={{ accentColor: '#F97031' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: isTaskComplete(task.id) ? 'line-through' : 'none',
                      opacity: isTaskComplete(task.id) ? 0.6 : 1,
                    }}
                  >
                    {task.title}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {task.owner ? Object.values(EMPLOYEES).find((e) => e.id === task.owner)?.name : 'Unassigned'} •{' '}
                    {task.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
