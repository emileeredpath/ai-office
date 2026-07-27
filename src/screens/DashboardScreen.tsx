import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export function DashboardScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const getActiveCampaigns = useAppStore((s) => s.getActiveCampaigns);
  const getWaitingForJohnTasks = useAppStore((s) => s.getWaitingForJohnTasks);
  const getOverdueTasks = useAppStore((s) => s.getOverdueTasks);

  const activeCampaigns = getActiveCampaigns();
  const waitingForJohn = getWaitingForJohnTasks();
  const overdueTasks = getOverdueTasks();

  const tasksDueThisWeek = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline >= today && deadline < weekFromNow && t.status !== 'complete';
    });
  })();

  const getStatusCount = (status: string) => tasks.filter((t) => t.status === status).length;
  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      mtech: '#0D1B2A',
      brentwood: '#3B82F6',
      'radio-links': '#0F6E56',
      capcom: '#534AB7',
      ircl: '#1D9E75',
    };
    return colors[brand] || '#6B7280';
  };

  // Data for Tasks by Status chart
  const statusData = [
    { name: 'In Progress', value: getStatusCount('in-progress'), fill: '#3B82F6' },
    { name: 'Not Started', value: getStatusCount('not-started'), fill: '#9CA3AF' },
    { name: 'Waiting John', value: getStatusCount('waiting-john'), fill: '#F59E0B' },
    { name: 'Waiting Approval', value: getStatusCount('waiting-approval'), fill: '#F97031' },
    { name: 'Complete', value: getStatusCount('complete'), fill: '#10B981' },
    { name: 'Blocked', value: getStatusCount('blocked'), fill: '#EF4444' },
  ];

  // Data for Tasks by Brand chart
  const brandCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    brandCounts[t.brand] = (brandCounts[t.brand] || 0) + 1;
  });

  const brandData = Object.entries(brandCounts).map(([brand, count]) => ({
    name: brand.charAt(0).toUpperCase() + brand.slice(1),
    value: count,
    fill: getBrandColor(brand),
  }));

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <div className="text-sm text-slate-600">Week of {new Date().toLocaleDateString()}</div>
        </div>

        {/* Stat Cards - Large Numbers */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-blue-600 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-slate-600">Active Campaigns</h3>
              <span className="text-xs text-green-600 font-semibold">↑ 12%</span>
            </div>
            <div className="text-5xl font-bold text-slate-900 mb-3">{activeCampaigns.length}</div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Q3 on track</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-orange-600 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-slate-600">Due This Week</h3>
              <span className="text-xs text-green-600 font-semibold">↑ 8%</span>
            </div>
            <div className="text-5xl font-bold text-slate-900 mb-3">{tasksDueThisWeek.length}</div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{overdueTasks.length} overdue</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-red-600 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-slate-600">Overdue</h3>
              <span className="text-xs text-red-600 font-semibold">↑ 2</span>
            </div>
            <div className="text-5xl font-bold text-slate-900 mb-3">{overdueTasks.length}</div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-600" style={{ width: '30%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Needs attention</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-amber-600 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-slate-600">Waiting for John</h3>
              <span className="text-xs text-amber-600 font-semibold">→</span>
            </div>
            <div className="text-5xl font-bold text-amber-600 mb-3">{waitingForJohn.length}</div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-600" style={{ width: '100%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Blocked</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Tasks by Status - Horizontal Bar Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Tasks by Status</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => value} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by Brand - Donut Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Tasks by Brand</h2>
            {brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="45%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => `${entry.payload.name}: ${entry.payload.value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-12">No tasks</p>
            )}
          </div>
        </div>

        {/* Active Campaigns with Progress */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">📌 Active Campaigns</h2>
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => {
              const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);
              const completedTasks = campaignTasks.filter((t) => t.status === 'complete').length;
              const progress = campaignTasks.length > 0 ? Math.round((completedTasks / campaignTasks.length) * 100) : 0;

              return (
                <div key={campaign.id} className="flex items-center gap-4 py-3 border-b border-slate-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{campaign.name}</p>
                  </div>
                  <BrandBadge brand={campaign.brand} />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium">Active</span>
                  <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-xs text-slate-600 w-12 text-right">{progress}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Waiting for John */}
          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-amber-600 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              ⚠️ Waiting for John ({waitingForJohn.length})
            </h2>
            {waitingForJohn.length > 0 ? (
              <div className="space-y-3">
                {waitingForJohn.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex justify-between items-start py-2 border-b border-slate-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-1">Since {task.deadline ? formatDate(task.deadline) : 'N/A'}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600">{task.priority?.toUpperCase() || 'MED'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">All clear!</p>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-red-600 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              🔴 Overdue Tasks ({overdueTasks.length})
            </h2>
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex justify-between items-start py-2 border-b border-slate-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-1">Due {task.deadline ? formatDate(task.deadline) : 'N/A'}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600">{task.priority?.toUpperCase() || 'HIGH'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">All caught up!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
