import { useEffect, useState } from 'react';
import { Mail, Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { BRAND_COLOR, BRAND_LABEL, brandBadgeTextColor } from '@/utils/brandColors';
import { Campaign, Task, Brand } from '@/types/index';
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
    <div
      style={{
        background: 'var(--color-bg)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1rem',
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          margin: '0 0 6px',
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
      {sub && (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{sub}</p>
      )}
    </div>
  );
}

export function DashboardScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const selectTask = useAppStore((s) => s.selectTask);

  const [traffic, setTraffic] = useState<Ga4Result | null>(null);
  useEffect(() => {
    apiFetch('/api/analytics/ga4')
      .then((r) => r.json())
      .then(setTraffic)
      .catch(() => setTraffic(null));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  // This week
  const sendsThisWeek = tasks.filter(
    (t) => t.type === 'email-send' && t.deadline && new Date(t.deadline) >= today && new Date(t.deadline) < weekEnd
  );
  const scheduledReach = sendsThisWeek.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const tasksDueThisWeek = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) >= today && new Date(t.deadline) < weekEnd && t.status !== 'complete'
  );
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active').length;
  const upcomingSends = sendsThisWeek
    .filter((t) => t.status !== 'complete')
    .sort((a, b) => new Date(a.deadline as Date).getTime() - new Date(b.deadline as Date).getTime());

  // This month — completed sends only, matching the calendar's monthly summary
  const sendsThisMonth = tasks.filter(
    (t) =>
      t.type === 'email-send' &&
      t.status === 'complete' &&
      t.deadline &&
      new Date(t.deadline) >= monthStart &&
      new Date(t.deadline) <= monthEnd
  );
  const monthRecipients = sendsThisMonth.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const monthSpend = sendsThisMonth.reduce((sum, t) => sum + (t.cost || 0), 0);
  const costPerRecipient = monthRecipients > 0 && monthSpend > 0 ? monthSpend / monthRecipients : null;

  const brandBreakdown = Object.entries(
    sendsThisMonth.reduce((acc, t) => {
      const key = t.brand;
      if (!acc[key]) acc[key] = { recipients: 0, cost: 0 };
      acc[key].recipients += t.recipients || 0;
      acc[key].cost += t.cost || 0;
      return acc;
    }, {} as Record<string, { recipients: number; cost: number }>)
  )
    .map(([brand, totals]) => ({ brand, ...totals }))
    .sort((a, b) => b.cost - a.cost);
  const maxBrandCost = Math.max(...brandBreakdown.map((b) => b.cost), 1);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <button
            onClick={() => exportTasksAsCSV(tasks, campaigns)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* This week */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>
            This week
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '1rem',
            }}
          >
            <MetricCard label="Sends scheduled" value={String(sendsThisWeek.length)} />
            <MetricCard label="Scheduled reach" value={scheduledReach.toLocaleString()} />
            <MetricCard label="Tasks due" value={String(tasksDueThisWeek.length)} />
            <MetricCard label="Campaigns active" value={String(activeCampaignsCount)} />
          </div>

          <div className="card">
            <p className="text-sm font-semibold text-text-secondary mb-3">UPCOMING SENDS</p>
            {upcomingSends.length > 0 ? (
              <div className="space-y-2">
                {upcomingSends.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    className="flex items-center gap-3 p-2 w-full text-left rounded hover:bg-surface"
                  >
                    <Mail size={14} style={{ color: BRAND_COLOR[task.brand], flexShrink: 0 }} />
                    <span className="text-sm text-text-primary font-medium flex-1 truncate">{task.title}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${BRAND_COLOR[task.brand]}1A`, color: BRAND_COLOR[task.brand] }}
                    >
                      {BRAND_LABEL[task.brand]}
                    </span>
                    {task.recipients != null && (
                      <span className="text-xs text-text-secondary">{task.recipients.toLocaleString()} recipients</span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {task.deadline ? formatDateShort(task.deadline) : '—'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No sends scheduled this week.</p>
            )}
          </div>
        </section>

        {/* This month */}
        <section>
          <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>
            This month
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '1rem',
            }}
          >
            <MetricCard label="Emails sent" value={String(sendsThisMonth.length)} />
            <MetricCard label="Total recipients" value={monthRecipients.toLocaleString()} />
            <MetricCard
              label="Total spend"
              value={`£${monthSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <MetricCard
              label="Cost per recipient"
              value={costPerRecipient != null ? `£${costPerRecipient.toFixed(3)}` : '—'}
            />
          </div>

          <div className="card">
            <p className="text-sm font-semibold text-text-secondary mb-3">BREAKDOWN BY BRAND</p>
            {brandBreakdown.length > 0 ? (
              <div className="space-y-3">
                {brandBreakdown.map((b) => (
                  <div key={b.brand} className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: BRAND_COLOR[b.brand as keyof typeof BRAND_COLOR],
                        color: brandBadgeTextColor(b.brand as Brand),
                        width: 100,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {BRAND_LABEL[b.brand as keyof typeof BRAND_LABEL]}
                    </span>
                    <span className="text-sm text-text-secondary" style={{ width: 130, flexShrink: 0 }}>
                      {b.recipients.toLocaleString()} recipients
                    </span>
                    <div style={{ flex: 1, height: 6, background: 'var(--color-surface)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(b.cost / maxBrandCost) * 100}%`,
                          background: BRAND_COLOR[b.brand as keyof typeof BRAND_COLOR],
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary" style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                      £{b.cost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No completed sends this month yet.</p>
            )}
          </div>
        </section>

        {/* Website Traffic — per-brand GA4, only shown once configured on the
            server. Silent otherwise, same as any other optional integration. */}
        {traffic?.configured && traffic.brands.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 className="text-text-primary" style={{ marginBottom: '1rem' }}>
              Website traffic
            </h2>
            <div className="card">
              <div className="space-y-3">
                {traffic.brands.map((b) => (
                  <div key={b.brand} className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: BRAND_COLOR[b.brand],
                        color: brandBadgeTextColor(b.brand),
                        width: 100,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {BRAND_LABEL[b.brand]}
                    </span>
                    <span className="text-sm text-text-secondary" style={{ flex: 1 }}>
                      This week: <span className="text-text-primary font-medium">{b.sessionsWeek.toLocaleString()}</span> sessions,{' '}
                      <span className="text-text-primary font-medium">{b.usersWeek.toLocaleString()}</span> users
                    </span>
                    <span className="text-sm text-text-secondary">
                      This month: <span className="text-text-primary font-medium">{b.sessionsMonth.toLocaleString()}</span> sessions,{' '}
                      <span className="text-text-primary font-medium">{b.usersMonth.toLocaleString()}</span> users
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
