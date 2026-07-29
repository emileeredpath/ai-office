import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { Campaign, Task } from '@/types/index';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

const TOKENS = {
  surface2: '#FFFFFF',
  surface1: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  radius: '8px',
};

const BRAND_COLORS: Record<string, string> = {
  mtech: '#0D1B2A',
  brentwood: '#3B82F6',
  'radio-links': '#0F6E56',
  capcom: '#534AB7',
  ircl: '#1D9E75',
  idaro: '#DB2777',
};

const BRAND_LABELS: Record<string, string> = {
  mtech: 'MTech',
  brentwood: 'Brentwood',
  'radio-links': 'Radio Links',
  capcom: 'Capcom',
  ircl: 'IRCL',
  idaro: 'IDARO',
};

function exportTasksAsCSV(tasks: Task[], campaigns: Campaign[]) {
  const csvHeaders = ['Task ID', 'Title', 'Brand', 'Status', 'Priority', 'Deadline', 'Campaign', 'Notes', 'Created At'];

  const csvRows = tasks.map((task) => {
    const campaign = campaigns.find((c) => c.id === task.campaignId);
    return [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.brand,
      task.status,
      task.priority,
      task.deadline ? formatDate(task.deadline) : '',
      campaign?.name || '',
      `"${(task.notes || '').replace(/"/g, '""')}"`,
      formatDate(task.createdAt),
    ].join(',');
  });

  const csv = [csvHeaders.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `mtech-tasks-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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

  const statusData = [
    { name: 'In progress', value: getStatusCount('in-progress'), fill: '#3B82F6' },
    { name: 'Not started', value: getStatusCount('not-started'), fill: '#9CA3AF' },
    { name: 'Waiting John', value: getStatusCount('waiting-john'), fill: '#F59E0B' },
    { name: 'Complete', value: getStatusCount('complete'), fill: '#10B981' },
  ];
  const maxStatusValue = Math.max(...statusData.map((d) => d.value), 1);

  const brandCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    brandCounts[t.brand] = (brandCounts[t.brand] || 0) + 1;
  });
  const totalBrandTasks = Object.values(brandCounts).reduce((a, b) => a + b, 0) || 1;
  const brandData = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({
      name: BRAND_LABELS[brand] || brand,
      value: count,
      pct: Math.round((count / totalBrandTasks) * 100),
      fill: BRAND_COLORS[brand] || '#6B7280',
    }));

  return (
    <div style={{ fontFamily: 'inherit', padding: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 500, color: TOKENS.textPrimary, margin: 0 }}>Dashboard</p>
            <p style={{ fontSize: '13px', color: TOKENS.textSecondary, margin: '2px 0 0' }}>
              Week of {formatDateShort(new Date())} {new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={() => exportTasksAsCSV(tasks, campaigns)}
            style={{
              background: '#F97031',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: TOKENS.radius,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Export
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <StatCard
            label="Active campaigns"
            trend="↑ 12%"
            trendColor="#10B981"
            value={activeCampaigns.length}
            barPct={60}
            color="#3B82F6"
            sub="Q3 on track"
          />
          <StatCard
            label="Due this week"
            trend="↑ 8%"
            trendColor="#10B981"
            value={tasksDueThisWeek.length}
            barPct={45}
            color="#F97031"
            sub={`${overdueTasks.length} overdue`}
          />
          <StatCard
            label="Overdue"
            trend="↓ 4%"
            trendColor="#EF4444"
            value={overdueTasks.length}
            valueColor="#EF4444"
            barPct={80}
            color="#EF4444"
            sub="Needs attention"
          />
          <StatCard
            label="Waiting for John"
            trend="— 0%"
            trendColor={TOKENS.textMuted}
            value={waitingForJohn.length}
            valueColor="#F59E0B"
            barPct={20}
            color="#F59E0B"
            sub="Blocked"
          />
        </div>

        {/* MTech AI card */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0D1B2A,#1A3A5C)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#fff', margin: 0 }}>MTech AI Marketing Office</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Open your Claude project to get AI help on any task
            </p>
          </div>
          <button
            onClick={() => window.open(MTECH_AI_PROJECT_URL, '_blank')}
            style={{
              background: '#F97031',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: TOKENS.radius,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Open MTech AI <ExternalLink size={14} />
          </button>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              background: TOKENS.surface2,
              border: `0.5px solid ${TOKENS.border}`,
              borderRadius: '12px',
              padding: '16px 18px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 500, color: TOKENS.textPrimary, margin: '0 0 16px' }}>
              Tasks by status
            </p>
            <ResponsiveContainer width="100%" height={statusData.length * 34}>
              <BarChart
                data={statusData}
                layout="vertical"
                barCategoryGap={10}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide domain={[0, maxStatusValue]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: TOKENS.textSecondary }}
                />
                <Bar dataKey="value" radius={4} background={{ fill: TOKENS.surface1, radius: 4 }} barSize={24}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="insideRight"
                    fill="#fff"
                    fontSize={11}
                    fontWeight={500}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: TOKENS.surface2,
              border: `0.5px solid ${TOKENS.border}`,
              borderRadius: '12px',
              padding: '16px 18px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 500, color: TOKENS.textPrimary, margin: '0 0 16px' }}>
              Tasks by brand
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flexShrink: 0, width: 110, height: 110 }}>
                {brandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brandData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {brandData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {brandData.map((b) => (
                  <div
                    key={b.name}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: TOKENS.textSecondary }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.fill, flexShrink: 0 }} />
                    {b.name}
                    <span style={{ fontWeight: 500, color: TOKENS.textPrimary, marginLeft: 'auto' }}>{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active campaigns */}
        <div
          style={{
            background: TOKENS.surface2,
            border: `0.5px solid ${TOKENS.border}`,
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 500, color: TOKENS.textPrimary, margin: '0 0 16px' }}>
            Active campaigns
          </p>
          {activeCampaigns.map((campaign, i) => {
            const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);
            const completedTasks = campaignTasks.filter((t) => t.status === 'complete').length;
            const progress = campaignTasks.length > 0 ? Math.round((completedTasks / campaignTasks.length) * 100) : 0;

            return (
              <div
                key={campaign.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < activeCampaigns.length - 1 ? `0.5px solid ${TOKENS.border}` : 'none',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 500, color: TOKENS.textPrimary, flex: 1 }}>
                  {campaign.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: '#fff',
                    background: BRAND_COLORS[campaign.brand] || '#6B7280',
                  }}
                >
                  {BRAND_LABELS[campaign.brand] || campaign.brand}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#E8F7F3',
                    color: '#0F6E56',
                  }}
                >
                  Active
                </span>
                <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: TOKENS.surface1, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: '#3B82F6', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: TOKENS.textSecondary, width: '28px', textAlign: 'right' }}>
                    {progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campaign results — populated once "Log results" is used on ended campaigns */}
        {(() => {
          const loggedCampaigns = campaigns.filter((c) => c.results);
          if (loggedCampaigns.length === 0) return null;

          const totalEnquiries = loggedCampaigns.reduce(
            (sum, c) => sum + (c.results?.enquiriesReceived || 0),
            0
          );
          const openRates = loggedCampaigns
            .map((c) => c.results?.emailOpenRate)
            .filter((v): v is number => v != null);
          const avgOpenRate = openRates.length > 0
            ? (openRates.reduce((sum, v) => sum + v, 0) / openRates.length).toFixed(1)
            : null;
          const totalCost = loggedCampaigns.reduce(
            (sum, c) => sum + (c.results?.costToSend || 0),
            0
          );

          return (
            <div
              style={{
                background: TOKENS.surface2,
                border: `0.5px solid ${TOKENS.border}`,
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '20px',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 500, color: TOKENS.textPrimary, margin: '0 0 16px' }}>
                Campaign results
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: TOKENS.textSecondary, margin: '0 0 4px' }}>Enquiries received</p>
                  <p style={{ fontSize: '24px', fontWeight: 600, color: TOKENS.textPrimary, margin: 0 }}>{totalEnquiries}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: TOKENS.textSecondary, margin: '0 0 4px' }}>Avg. email open rate</p>
                  <p style={{ fontSize: '24px', fontWeight: 600, color: TOKENS.textPrimary, margin: 0 }}>
                    {avgOpenRate != null ? `${avgOpenRate}%` : '—'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: TOKENS.textSecondary, margin: '0 0 4px' }}>Total cost to send</p>
                  <p style={{ fontSize: '24px', fontWeight: 600, color: TOKENS.textPrimary, margin: 0 }}>
                    £{totalCost.toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '12px', padding: '16px 18px' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#854F0B',
              }}
            >
              <AlertTriangle size={14} /> Waiting for John ({waitingForJohn.length})
            </p>
            {waitingForJohn.length > 0 ? (
              waitingForJohn.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0 8px 10px',
                    borderBottom: i < waitingForJohn.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                    borderLeft: `3px solid ${
                      task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F97031' : '#9CA3AF'
                    }`,
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: TOKENS.textPrimary, fontWeight: 500 }}>{task.title}</span>
                  <span style={{ color: TOKENS.textSecondary }}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} · {BRAND_LABELS[task.brand] || task.brand}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: TOKENS.textSecondary, margin: 0 }}>All clear!</p>
            )}
          </div>

          <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: '12px', padding: '16px 18px' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#A32D2D',
              }}
            >
              <Clock size={14} /> Overdue tasks ({overdueTasks.length})
            </p>
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0 8px 10px',
                    borderBottom: i < overdueTasks.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                    borderLeft: `3px solid ${
                      task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F97031' : '#9CA3AF'
                    }`,
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: TOKENS.textPrimary, fontWeight: 500 }}>{task.title}</span>
                  <span style={{ color: TOKENS.textSecondary }}>
                    {task.deadline ? formatDateShort(task.deadline) : '—'}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: TOKENS.textSecondary, margin: 0 }}>All caught up!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  trend,
  trendColor,
  value,
  valueColor,
  barPct,
  color,
  sub,
}: {
  label: string;
  trend: string;
  trendColor: string;
  value: number;
  valueColor?: string;
  barPct: number;
  color: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: TOKENS.surface2,
        border: `0.5px solid ${TOKENS.border}`,
        borderRadius: '12px',
        padding: '16px 18px',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <p
        style={{
          fontSize: '12px',
          color: TOKENS.textSecondary,
          margin: '0 0 4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {label}
        <span style={{ fontSize: '11px', fontWeight: 500, color: trendColor }}>{trend}</span>
      </p>
      <p
        style={{
          fontSize: '48px',
          fontWeight: 600,
          color: valueColor || TOKENS.textPrimary,
          margin: '4px 0 8px',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      <div style={{ height: '3px', background: TOKENS.border, borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: '2px' }} />
      </div>
      <p style={{ fontSize: '12px', color: TOKENS.textSecondary, margin: 0 }}>{sub}</p>
    </div>
  );
}
