import { useEffect, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { BRAND_COLOR, BRAND_LABEL, brandBadgeTextColor } from '@/utils/brandColors';
import { Campaign, CampaignStatus, Task, Brand } from '@/types/index';
import { apiFetch } from '@/services/apiConfig';

interface BrandTraffic {
  brand: Brand;
  sessionsWeek: number;
  usersWeek: number;
  sessionsMonth: number;
  usersMonth: number;
}

interface Ga4Result {
  configured: boolean;
  brands: BrandTraffic[];
  errors: string[];
}

// Placeholder until Acumatica API access exists — see the Dashboard
// Redesign brief. Swap this for the real instance URL whenever it's ready.
const ACUMATICA_URL = 'https://brentwoodcommunications.acumatica.com/Main?CompanyID=MTECH+Brentwood+Communications+(Live)&ScreenId=DB000055';

const STATUS_LABEL: Record<CampaignStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
};
const STATUS_COLOR: Record<CampaignStatus, string> = {
  planning: '#F59E0B',
  active: '#10B981',
  'on-hold': '#EF4444',
  completed: '#6B7280',
};
const PIPELINE_COLUMNS: CampaignStatus[] = ['planning', 'active', 'on-hold', 'completed'];

// Mirrors the one objective currently defined in ObjectivesScreen — objectives
// aren't backend-synced yet (that screen holds its own local-only state), so
// this is duplicated rather than shared until that gets lifted into the store.
const FEATURED_OBJECTIVE = {
  title: 'Q3 Education Campaign',
  goal: 'Generate 50 education sector enquiries for MTech Group by end of August 2026',
  status: 'Planning',
  deadline: '31/08/2026',
  budget: 8000,
  kpis: [
    { name: 'Email Opens', target: '25%' },
    { name: 'Click Rate', target: '3%' },
    { name: 'Enquiries', target: '50' },
  ],
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

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: '12px', padding: '1rem' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.25rem',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 700, color: accent || 'var(--color-text-primary)', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>{sub}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>{title}</p>
      {children}
    </div>
  );
}

export function DashboardScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const selectTask = useAppStore((s) => s.selectTask);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const getTasksForToday = useAppStore((s) => s.getTasksForToday);
  const getOverdueTasks = useAppStore((s) => s.getOverdueTasks);
  const { isEditor } = useAuth();

  const [traffic, setTraffic] = useState<Ga4Result | null>(null);
  useEffect(() => {
    apiFetch('/api/analytics/ga4')
      .then((r) => r.json())
      .then(setTraffic)
      .catch(() => setTraffic(null));
  }, []);

  const now = new Date();
  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = isEditor ? 'Emilee' : 'John';
  const formattedDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  // Quick stats
  const tasksDueToday = getTasksForToday();
  const overdueTasks = getOverdueTasks();
  const completedThisMonth = tasks.filter(
    (t) => t.status === 'complete' && t.completedAt && new Date(t.completedAt) >= monthStart && new Date(t.completedAt) <= monthEnd
  );
  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const campaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter((t) => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return { progress: 0, completed: 0, total: 0 };
    const completed = campaignTasks.filter((t) => t.status === 'complete').length;
    return { progress: Math.round((completed / campaignTasks.length) * 100), completed, total: campaignTasks.length };
  };
  const avgActiveProgress =
    activeCampaigns.length > 0
      ? Math.round(activeCampaigns.reduce((sum, c) => sum + campaignProgress(c.id).progress, 0) / activeCampaigns.length)
      : 0;

  // This week
  const sendsThisWeek = tasks.filter(
    (t) => t.type === 'email-send' && t.deadline && new Date(t.deadline) >= today && new Date(t.deadline) < weekEnd
  );
  const upcomingSends = sendsThisWeek
    .filter((t) => t.status !== 'complete')
    .sort((a, b) => new Date(a.deadline as Date).getTime() - new Date(b.deadline as Date).getTime());

  // This month — completed sends only, matching the calendar's monthly summary
  const sendsThisMonth = tasks.filter(
    (t) => t.type === 'email-send' && t.status === 'complete' && t.deadline && new Date(t.deadline) >= monthStart && new Date(t.deadline) <= monthEnd
  );
  const monthRecipients = sendsThisMonth.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const monthSpend = sendsThisMonth.reduce((sum, t) => sum + (t.cost || 0), 0);
  const costPerRecipient = monthRecipients > 0 && monthSpend > 0 ? monthSpend / monthRecipients : null;

  const brandBreakdown = Object.entries(
    sendsThisMonth.reduce((acc, t) => {
      if (!acc[t.brand]) acc[t.brand] = { recipients: 0, cost: 0 };
      acc[t.brand].recipients += t.recipients || 0;
      acc[t.brand].cost += t.cost || 0;
      return acc;
    }, {} as Record<string, { recipients: number; cost: number }>)
  ).map(([brand, totals]) => ({ brand: brand as Brand, ...totals }));

  // Pipeline kanban
  const campaignsByStatus = PIPELINE_COLUMNS.reduce((acc, status) => {
    acc[status] = campaigns.filter((c) => c.status === status);
    return acc;
  }, {} as Record<CampaignStatus, Campaign[]>);

  // Active campaigns overview
  const activeCampaignsOverview = activeCampaigns
    .map((c) => ({ campaign: c, ...campaignProgress(c.id) }))
    .sort((a, b) => b.campaign.spend - a.campaign.spend);

  // Chart 1: Campaign spend by brand
  const spendByBrand = Object.entries(
    campaigns.reduce((acc, c) => {
      if (c.spend > 0) acc[c.brand] = (acc[c.brand] || 0) + c.spend;
      return acc;
    }, {} as Record<string, number>)
  ).map(([brand, value]) => ({ name: BRAND_LABEL[brand as Brand], value, fill: BRAND_COLOR[brand as Brand] }));

  // Chart 2: Website traffic this month by brand
  const trafficByBrand = (traffic?.brands || []).map((b) => ({
    name: BRAND_LABEL[b.brand],
    sessions: b.sessionsMonth,
    fill: BRAND_COLOR[b.brand],
  }));

  // Chart 3: Task completion trend — real cumulative completions this month
  const daysSoFar = today.getDate();
  let cumulative = 0;
  const completionTrend = Array.from({ length: daysSoFar }, (_, i) => {
    const day = i + 1;
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), day, 23, 59, 59);
    const completedOnDay = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= monthStart && new Date(t.completedAt) <= dayEnd
    ).length;
    cumulative = completedOnDay;
    return { day: String(day), completed: cumulative };
  });

  // Chart 4: Budget utilisation — active campaigns with a budget set
  const budgeted = activeCampaigns.filter((c) => c.budget != null && c.budget > 0);
  const totalBudget = budgeted.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalBudgetSpend = budgeted.reduce((sum, c) => sum + c.spend, 0);
  const budgetPct = totalBudget > 0 ? Math.min(Math.round((totalBudgetSpend / totalBudget) * 100), 999) : 0;
  const budgetColor = budgetPct >= 100 ? '#EF4444' : budgetPct >= 80 ? '#F59E0B' : '#10B981';

  // Chart 5: Campaign status breakdown
  const statusBreakdown = PIPELINE_COLUMNS.map((status) => ({
    name: STATUS_LABEL[status],
    value: campaignsByStatus[status].length,
    fill: STATUS_COLOR[status],
  })).filter((d) => d.value > 0);

  // Chart 6: Send performance — recipients per brand this month
  const sendPerformance = brandBreakdown.map((b) => ({ name: BRAND_LABEL[b.brand], recipients: b.recipients, fill: BRAND_COLOR[b.brand] }));

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              {greeting}, {userName}
            </h1>
            <p className="text-text-secondary">{formattedDate}</p>
          </div>
          <button onClick={() => exportTasksAsCSV(tasks, campaigns)} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          <StatCard label="Due today" value={String(tasksDueToday.length)} sub="Tasks due" />
          <StatCard label="Overdue" value={String(overdueTasks.length)} sub="Requires attention" accent="#EF4444" />
          <StatCard label="Completed" value={String(completedThisMonth.length)} sub="This month" accent="#10B981" />
          <StatCard label="Active campaigns" value={String(activeCampaigns.length)} sub={`${avgActiveProgress}% average progress`} />
        </div>

        {/* Quarterly objectives */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>
            Quarterly objectives
          </h2>
          <div className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-text-primary" style={{ fontSize: 16 }}>{FEATURED_OBJECTIVE.title}</h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: '#EFF6FF', color: '#0369A1' }}
              >
                {FEATURED_OBJECTIVE.status}
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-3">{FEATURED_OBJECTIVE.goal}</p>
            <p className="text-xs text-text-secondary mb-4">
              Due {FEATURED_OBJECTIVE.deadline} · Budget £{FEATURED_OBJECTIVE.budget.toLocaleString()}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {FEATURED_OBJECTIVE.kpis.map((kpi) => (
                <div key={kpi.name} style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '0.75rem' }}>
                  <p className="text-xs text-text-secondary mb-1">{kpi.name}</p>
                  <p className="text-sm font-semibold text-text-primary">— / {kpi.target}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Campaign pipeline */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>
            Campaign pipeline
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {PIPELINE_COLUMNS.map((status) => (
              <div key={status} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 12 }}>
                <div className="flex items-center gap-2" style={{ padding: '0.75rem 1rem', borderBottom: '0.5px solid var(--color-border)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLOR[status] }} />
                  <span className="text-sm font-semibold text-text-primary">{STATUS_LABEL[status]}</span>
                  <span className="text-xs text-text-secondary" style={{ marginLeft: 'auto' }}>{campaignsByStatus[status].length}</span>
                </div>
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {campaignsByStatus[status].length === 0 && <p className="text-xs text-text-secondary">No campaigns</p>}
                  {campaignsByStatus[status].slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCampaign(c.id)}
                      style={{ textAlign: 'left', background: 'var(--color-surface)', borderRadius: 8, padding: '0.5rem 0.625rem' }}
                    >
                      <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                      <p className="text-xs text-text-secondary" style={{ marginTop: 2 }}>£{c.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </button>
                  ))}
                  {campaignsByStatus[status].length > 3 && (
                    <p className="text-xs text-text-secondary">+{campaignsByStatus[status].length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sends + campaigns overview */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>This week's sends</h2>
              <div className="card">
                {upcomingSends.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Send</th>
                        <th>Brand</th>
                        <th style={{ textAlign: 'right' }}>Recipients</th>
                        <th style={{ textAlign: 'right' }}>Cost</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingSends.map((task) => (
                        <tr key={task.id} onClick={() => selectTask(task.id)}>
                          <td className="truncate" style={{ maxWidth: 160 }}>{task.title}</td>
                          <td>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded"
                              style={{ backgroundColor: `${BRAND_COLOR[task.brand]}1A`, color: BRAND_COLOR[task.brand] }}
                            >
                              {BRAND_LABEL[task.brand]}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{task.recipients != null ? task.recipients.toLocaleString() : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{task.cost != null ? `£${task.cost.toFixed(2)}` : '—'}</td>
                          <td>{task.deadline ? formatDateShort(task.deadline) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-text-secondary">No sends scheduled this week.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>Active campaigns overview</h2>
              <div className="card">
                {activeCampaignsOverview.length > 0 ? (
                  <div className="space-y-4">
                    {activeCampaignsOverview.map(({ campaign, progress, completed, total }) => (
                      <button key={campaign.id} onClick={() => selectCampaign(campaign.id)} className="w-full text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-text-primary truncate">{campaign.name}</span>
                          <span className="text-sm font-semibold text-text-primary" style={{ flexShrink: 0, marginLeft: 8 }}>
                            £{campaign.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: 6, background: 'var(--color-surface)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: '#3B82F6', borderRadius: 3 }} />
                          </div>
                          <span className="text-xs text-text-secondary" style={{ flexShrink: 0 }}>{completed}/{total} · {progress}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No active campaigns.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* This month summary */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>This month</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <MetricCard label="Emails sent" value={String(sendsThisMonth.length)} />
            <MetricCard label="Total recipients" value={monthRecipients.toLocaleString()} />
            <MetricCard label="Total spend" value={`£${monthSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <MetricCard label="Cost per recipient" value={costPerRecipient != null ? `£${costPerRecipient.toFixed(3)}` : '—'} />
          </div>
        </section>

        {/* Charts */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <ChartCard title="Campaign spend by brand">
              {spendByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={spendByBrand} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(d) => `${d.name} ${Math.round((d.value / spendByBrand.reduce((s, x) => s + x.value, 0)) * 100)}%`}>
                      {spendByBrand.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `£${v.toLocaleString('en-GB')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-text-secondary">No campaign spend yet.</p>
              )}
            </ChartCard>

            <ChartCard title="Website traffic this month">
              {trafficByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trafficByBrand} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="sessions" radius={4}>
                      {trafficByBrand.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-text-secondary">GA4 not configured yet.</p>
              )}
            </ChartCard>

            <ChartCard title="Task completion trend (this month)">
              {completionTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={completionTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-text-secondary">Not enough data yet this month.</p>
              )}
            </ChartCard>

            <ChartCard title="Budget utilisation">
              {totalBudget > 0 ? (
                <div style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart
                      data={[{ name: 'Budget', value: Math.min(budgetPct, 100), fill: budgetColor }]}
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar dataKey="value" background cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: budgetColor, margin: 0 }}>{budgetPct}%</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                      £{totalBudgetSpend.toLocaleString('en-GB')} / £{totalBudget.toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No active campaigns have a budget set.</p>
              )}
            </ChartCard>

            <ChartCard title="Campaign status breakdown">
              {statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(d) => `${d.name} (${d.value})`}>
                      {statusBreakdown.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-text-secondary">No campaigns yet.</p>
              )}
            </ChartCard>

            <ChartCard title="Send performance (recipients by brand)">
              {sendPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sendPerformance} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="recipients" radius={4}>
                      {sendPerformance.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-text-secondary">No completed sends this month yet.</p>
              )}
            </ChartCard>
          </div>
        </section>

        {/* Website traffic cards */}
        {traffic?.configured && traffic.brands.length > 0 && (
          <section>
            <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>Website traffic</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {traffic.brands.map((b) => (
                <div key={b.brand} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1rem' }}>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: BRAND_COLOR[b.brand], color: brandBadgeTextColor(b.brand), display: 'inline-block', marginBottom: 8 }}
                  >
                    {BRAND_LABEL[b.brand]}
                  </span>
                  <p className="text-xs text-text-secondary" style={{ margin: '0 0 2px' }}>This week</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>{b.sessionsWeek.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary" style={{ margin: '0 0 2px' }}>This month</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{b.sessionsMonth.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Acumatica */}
        <section style={{ marginTop: '2rem' }}>
          <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <p className="font-semibold text-text-primary" style={{ margin: '0 0 4px' }}>Acumatica integration</p>
              <p className="text-sm text-text-secondary" style={{ margin: 0 }}>Manage detailed campaign codes, budgets, and timelines in Acumatica</p>
            </div>
            {ACUMATICA_URL ? (
              <a href={ACUMATICA_URL} target="_blank" rel="noreferrer" className="btn btn-secondary flex items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                Open Acumatica <ExternalLink size={14} />
              </a>
            ) : (
              <span className="text-xs text-text-secondary" style={{ whiteSpace: 'nowrap' }}>URL not yet configured</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
