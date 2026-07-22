import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';

export function DashboardScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const getActiveCampaigns = useAppStore((s) => s.getActiveCampaigns);
  const getWaitingForJohnTasks = useAppStore((s) => s.getWaitingForJohnTasks);
  const getOverdueTasks = useAppStore((s) => s.getOverdueTasks);
  const getTasksForToday = useAppStore((s) => s.getTasksForToday);

  const activeCampaigns = getActiveCampaigns();
  const waitingForJohn = getWaitingForJohnTasks();
  const overdueTasks = getOverdueTasks();
  const tasksDueThisWeek = getTasksForToday(); // Simplified

  const getStatusCount = (status: string) => tasks.filter((t) => t.status === status).length;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard title="Active campaigns" value={activeCampaigns.length} />
          <StatCard title="Tasks this week" value={tasksDueThisWeek.length} />
          <StatCard title="Overdue" value={overdueTasks.length} />
          <StatCard title="Waiting for John" value={waitingForJohn.length} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Active Campaigns Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Active Campaigns</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {activeCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="font-medium">{campaign.name}</td>
                    <td>
                      <BrandBadge brand={campaign.brand} />
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#10B981', color: 'white' }}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="text-sm text-text-secondary">{formatDate(campaign.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tasks by Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Tasks by Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">In Progress</span>
                <span className="font-semibold">{getStatusCount('in-progress')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Waiting for John</span>
                <span className="font-semibold text-warning">{getStatusCount('waiting-john')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Not Started</span>
                <span className="font-semibold">{getStatusCount('not-started')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Complete</span>
                <span className="font-semibold text-success">{getStatusCount('complete')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Overdue Tasks</h2>
            {overdueTasks.length > 0 ? (
              <table className="table">
                <tbody>
                  {overdueTasks.slice(0, 5).map((task) => (
                    <tr key={task.id}>
                      <td className="font-medium">{task.title}</td>
                      <td className="text-sm text-danger">{formatDate(task.deadline!)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-secondary">No overdue tasks</p>
            )}
          </div>

          {/* Waiting for John */}
          <div className="card bg-orange-50 border-orange-100">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Waiting for John</h2>
            {waitingForJohn.length > 0 ? (
              <table className="table">
                <tbody>
                  {waitingForJohn.slice(0, 5).map((task) => (
                    <tr key={task.id}>
                      <td className="font-medium">{task.title}</td>
                      <td className="text-sm">
                        <BrandBadge brand={task.brand} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-secondary">All clear!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
