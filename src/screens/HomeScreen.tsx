import { useEffect, useMemo } from 'react';
import { ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { CampaignStatus } from '@/types/index';
import type { AuditLogEntry } from '@/services/auditLogApi';

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

const STATUS_BADGE_STYLE: Record<CampaignStatus, { background: string; color: string }> = {
  active: { background: '#10b981', color: 'white' },
  completed: { background: '#9ca3af', color: 'white' },
  planning: { background: '#3b82f6', color: 'white' },
  'on-hold': { background: '#f59e0b', color: 'white' },
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  planning: 'Planning',
  'on-hold': 'On Hold',
};

function describeAuditEntry(entry: AuditLogEntry): string {
  const value = (entry.newValue ?? entry.previousValue) as any;
  const label = value?.title || value?.name || value?.schemeName || entry.resourceId || entry.resourceType;
  const resourceLabel = entry.resourceType.replace(/_/g, ' ');
  const verb = entry.action.startsWith('create')
    ? 'Created'
    : entry.action.startsWith('update')
    ? 'Updated'
    : entry.action.startsWith('complete')
    ? 'Completed'
    : entry.action.startsWith('delete')
    ? 'Archived'
    : entry.action.startsWith('restore')
    ? 'Restored'
    : entry.action.startsWith('import')
    ? 'Imported into'
    : 'Changed';
  return `${verb} ${resourceLabel} "${label}"`;
}

export function HomeScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const auditLog = useAppStore((s) => s.auditLog);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncAuditLog = useAppStore((s) => s.syncAuditLog);
  const selectTask = useAppStore((s) => s.selectTask);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { isEditor } = useAuth();

  useEffect(() => {
    syncFundingRecordsFromApi();
    syncAuditLog();
  }, [syncFundingRecordsFromApi, syncAuditLog]);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = formatDate(today);
  const userName = isEditor ? 'Emilee' : 'John';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Attention items: waiting-approval / waiting-john, or deadline within 48h
  const attentionItems = useMemo(() => {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return tasks.filter((t) => {
      if (t.status === 'complete') return false;
      if (t.status === 'waiting-approval' || t.status === 'waiting-john') return true;
      if (t.deadline) {
        const d = new Date(t.deadline);
        return d >= now && d <= in48h;
      }
      return false;
    });
  }, [tasks]);

  const attentionReason = (taskId: string): string => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return '';
    if (task.status === 'waiting-approval') return 'Waiting approval';
    if (task.status === 'waiting-john') return 'Waiting for John';
    if (task.deadline) return `Due ${formatDateShort(task.deadline)}`;
    return '';
  };

  const liveCampaignsCount = campaigns.filter((c) => c.status === 'active').length;
  const awaitingApprovalCount = tasks.filter((t) => t.status === 'waiting-approval').length;

  const activeCampaignsTable = useMemo(() => {
    return campaigns
      .filter((c) => c.status === 'active')
      .map((c) => {
        const campaignTasks = tasks.filter((t) => t.campaignId === c.id);
        const total = campaignTasks.length;
        const complete = campaignTasks.filter((t) => t.status === 'complete').length;
        const upcoming = campaignTasks
          .filter((t) => t.deadline && t.status !== 'complete')
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          progress: total > 0 ? Math.round((complete / total) * 100) : null,
          due: upcoming?.deadline ?? null,
        };
      });
  }, [campaigns, tasks]);

  const fundingSummary = useMemo(() => {
    const balance = fundingRecords.reduce((sum, r) => sum + r.balanceToClaim, 0);
    const pending = fundingRecords.filter((r) => r.claimStatus === 'eligible' || r.claimStatus === 'submitted').length;
    return { balance, pending, count: fundingRecords.length };
  }, [fundingRecords]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{getGreeting()}, {userName}</h1>
            <p className="text-text-secondary">{dayName} {dateStr}</p>
          </div>
        </div>

        {/* Attention Items */}
        <div className="mb-8">
          {attentionItems.length > 0 ? (
            <div
              className="rounded-lg p-5"
              style={{ backgroundColor: '#FEF3E2', border: '1px solid #FAC775' }}
            >
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <AlertTriangle size={16} color="#D97706" />
                {attentionItems.length} thing{attentionItems.length === 1 ? '' : 's'} need{attentionItems.length === 1 ? 's' : ''} your attention
              </h2>
              <div className="space-y-2">
                {attentionItems.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded bg-white hover:bg-gray-50 transition-colors"
                    style={{ border: '1px solid #FAC775' }}
                  >
                    <span className="text-sm font-medium text-text-primary">{task.title}</span>
                    <span className="text-xs text-text-secondary flex-shrink-0 ml-3">{attentionReason(task.id)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-5 flex items-center gap-2" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span className="text-sm font-medium text-text-primary">Nothing urgent right now</span>
            </div>
          )}
        </div>

        {/* Orange Divider */}
        <div style={{ height: '3px', backgroundColor: '#ff9d3d', marginBottom: '2rem' }} />

        {/* KPI Tiles */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard title="Live campaigns" value={liveCampaignsCount} accent="#10b981" />
          <StatCard title="Awaiting approval" value={awaitingApprovalCount} accent="#F59E0B" />
          {fundingSummary.count > 0 ? (
            <StatCard title="Funding balance to claim" value={Math.round(fundingSummary.balance)} accent="#0D1B2A" />
          ) : (
            <div className="card" style={{ borderLeft: '4px solid #9CA3AF' }}>
              <div className="text-text-secondary text-sm font-medium mb-3">Funding balance to claim</div>
              <div className="text-lg font-medium text-text-secondary">No funding records logged</div>
            </div>
          )}
        </div>

        {/* Active Campaigns Table + Recent Activity */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <h2 className="text-lg font-semibold text-text-primary mb-4">ACTIVE CAMPAIGNS</h2>
            {activeCampaignsTable.length > 0 ? (
              <div className="card p-0" style={{ overflow: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Progress</th>
                      <th>Next Due</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCampaignsTable.map((c) => (
                      <tr key={c.id} onClick={() => selectCampaign(c.id)} style={{ cursor: 'pointer' }}>
                        <td className="font-medium text-text-primary">{c.name}</td>
                        <td>
                          <span className="badge" style={{ ...STATUS_BADGE_STYLE[c.status], fontSize: '11px' }}>
                            {STATUS_LABEL[c.status]}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{c.progress !== null ? `${c.progress}%` : '—'}</td>
                        <td className="text-sm text-text-secondary">{c.due ? formatDateShort(c.due) : '—'}</td>
                        <td className="text-sm text-text-secondary">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-secondary">No active campaigns</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">RECENT ACTIVITY</h2>
            <div className="card">
              {auditLog.length > 0 ? (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="text-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <div className="text-text-primary">{describeAuditEntry(entry)}</div>
                      <div className="text-xs text-text-secondary mt-1">{formatDateShort(entry.createdAt)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* MTech AI Quick Access */}
        <div className="mb-8">
          <div className="rounded-lg p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)' }}>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Get AI Help</h3>
              <p className="text-sm text-white opacity-75">Generate prompts for any marketing task using MTech AI</p>
            </div>
            <button
              onClick={() => window.open(MTECH_AI_PROJECT_URL, '_blank')}
              className="flex items-center gap-2 whitespace-nowrap text-white font-medium px-5 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-brand-mtech-accent)' }}
            >
              Open MTech AI
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
