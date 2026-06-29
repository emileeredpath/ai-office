import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint } from '@/hooks/useAnalytics';

interface TaskCompletionTrendChartProps {
  data: TrendDataPoint[];
}

export function TaskCompletionTrendChart({ data }: TaskCompletionTrendChartProps) {
  const lastSevenDays = data.slice(-7);

  return (
    <div className="bg-[#1D2A3A] rounded-xl p-5 border border-[#3a4f6a]">
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0F4F8' }}>
        Tasks Completed per Day
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={lastSevenDays}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4f6a" />
          <XAxis
            dataKey="date"
            stroke="#8F9194"
            tick={{ fontSize: 12 }}
            style={{ color: '#8F9194' }}
          />
          <YAxis
            stroke="#8F9194"
            tick={{ fontSize: 12 }}
            style={{ color: '#8F9194' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#243347',
              border: '1px solid #3a4f6a',
              borderRadius: '8px',
              color: '#F0F4F8',
            }}
            labelStyle={{ color: '#F0F4F8' }}
          />
          <Bar
            dataKey="completed"
            fill="#6366f1"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
