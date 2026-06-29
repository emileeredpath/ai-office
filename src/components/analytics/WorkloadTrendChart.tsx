import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint } from '@/hooks/useAnalytics';

interface WorkloadTrendChartProps {
  data: TrendDataPoint[];
}

export function WorkloadTrendChart({ data }: WorkloadTrendChartProps) {
  const lastSevenDays = data.slice(-7);

  return (
    <div className="bg-[#1D2A3A] rounded-xl p-5 border border-[#3a4f6a]">
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0F4F8' }}>
        Workload Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lastSevenDays}>
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
            domain={[0, 100]}
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
            formatter={(value) => `${Math.round(value as number)}%`}
          />
          <Line
            type="monotone"
            dataKey="workload"
            stroke="#F9701F"
            strokeWidth={2}
            dot={{ fill: '#F9701F', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
