import { useState } from 'react';
import { Users, TrendingUp, ListTodo, BarChart3 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { OverviewCard } from '@/components/analytics/OverviewCard';
import { WorkloadChart } from '@/components/analytics/WorkloadChart';
import { TaskMetrics } from '@/components/analytics/TaskMetrics';
import { EmployeeTable } from '@/components/analytics/EmployeeTable';
import { BottleneckAnalysis } from '@/components/analytics/BottleneckAnalysis';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { WorkloadTrendChart } from '@/components/analytics/WorkloadTrendChart';
import { TaskCompletionTrendChart } from '@/components/analytics/TaskCompletionTrendChart';
import { PriorityDistributionChart } from '@/components/analytics/PriorityDistributionChart';
import { ExportButton } from '@/components/analytics/ExportButton';

export function AnalyticsPage() {
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { start, end };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const metrics = useAnalytics(dateRange);

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Filter and Export */}
        <div className="mb-8 flex justify-between items-start gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl mb-2" style={{ color: '#F0F4F8' }}>
              Team Analytics
            </h1>
            <p className="text-sm" style={{ color: '#8F9194' }}>
              Real-time metrics and team capacity overview
            </p>
          </div>
          <div className="flex gap-3">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <ExportButton metrics={metrics} dateRange={dateRange} />
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <OverviewCard
            label="Active Employees"
            value={`${metrics.activeCount}/${metrics.totalEmployees}`}
            accentColor="#22c55e"
            icon={<Users size={20} />}
          />
          <OverviewCard
            label="Average Workload"
            value={`${metrics.averageWorkload}%`}
            accentColor="#F9701F"
            icon={<BarChart3 size={20} />}
          />
          <OverviewCard
            label="Tasks Queued"
            value={metrics.queuedTasksTotal}
            accentColor="#f59e0b"
            icon={<ListTodo size={20} />}
          />
          <OverviewCard
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
            accentColor="#6366f1"
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Trend Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WorkloadTrendChart data={metrics.trendData} />
          <TaskCompletionTrendChart data={metrics.trendData} />
        </div>

        {/* Priority Distribution Chart */}
        <div className="mb-8">
          <PriorityDistributionChart data={metrics.trendData} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WorkloadChart employees={metrics.employeeMetrics.map(em => ({
            id: em.id,
            emoji: em.emoji,
            name: em.name,
            status: em.status,
            workloadPercent: em.workloadPercent,
            role: em.name,
            deskNumber: 0,
            personality: [],
            currentTask: em.currentTaskTitle ? { id: 'dummy', title: em.currentTaskTitle, priority: 'medium', createdAt: '' } : null,
            taskQueue: Array(em.queuedCount).fill(null),
            completedWork: Array(em.completedCount).fill(null),
            accentColor: '#F9701F',
            idleAnimation: 'typing',
          }))} />
          <TaskMetrics
            completionRate={metrics.completionRate}
            tasksByPriority={metrics.tasksByPriority}
          />
        </div>

        {/* Employee Table */}
        <div className="mb-8">
          <EmployeeTable employees={metrics.employeeMetrics} />
        </div>

        {/* Bottleneck Analysis */}
        <BottleneckAnalysis
          overloadedEmployees={metrics.overloadedEmployees}
          longQueues={metrics.longQueues}
          availableCapacity={metrics.availableCapacity}
        />
      </div>
    </div>
  );
}
