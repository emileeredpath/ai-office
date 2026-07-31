import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CAMPAIGN_PLAN_MARKDOWN } from '@/data/campaignPlans';
import { parsePlanMarkdown, PlanSection } from '@/utils/planMarkdown';
import { formatDateShort } from '@/utils/dateUtils';
import { Campaign, Task, TaskStatus } from '@/types/index';

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'waiting-approval': 'Waiting Approval',
  'waiting-john': 'Waiting for John',
  'waiting-customer': 'Waiting Customer',
  'approved-ready': 'Approved Ready',
  blocked: 'Blocked',
  complete: 'Complete',
};

function PlanSectionView({ section, defaultOpen }: { section: PlanSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasContent = section.paragraphs.length > 0 || section.tables.length > 0 || section.checklist.length > 0;
  if (!hasContent) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
        style={{ padding: '0.5rem 0' }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-sm font-medium text-text-primary">{section.title}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: '0.75rem', paddingLeft: '1.25rem' }}>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="text-xs text-text-secondary" style={{ marginBottom: 6 }}>
              {p}
            </p>
          ))}
          {section.tables.map((table, ti) => (
            <div key={ti} style={{ overflowX: 'auto', marginBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {table.headers.map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '3px 6px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {table.headers.map((h) => (
                        <td key={h} style={{ padding: '3px 6px', color: 'var(--color-text-secondary)' }}>
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {section.checklist.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.checklist.map((item, i) => (
                <li key={i} className="text-xs" style={{ display: 'flex', gap: 6, marginBottom: 4, color: item.done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                  <span>{item.done ? '☑' : '☐'}</span>
                  <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function PlanTab({ campaign, campaignTasks, onSelectTask }: { campaign: Campaign; campaignTasks: Task[]; onSelectTask: (id: string) => void }) {
  const markdown = CAMPAIGN_PLAN_MARKDOWN[campaign.id];
  const plan = markdown ? parsePlanMarkdown(markdown) : null;

  const statusCounts = campaignTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Partial<Record<TaskStatus, number>>);

  const nextActions = campaignTasks
    .filter((t) => t.status !== 'complete' && t.deadline)
    .sort((a, b) => new Date(a.deadline as Date).getTime() - new Date(b.deadline as Date).getTime())
    .slice(0, 5);

  return (
    <div>
      {/* Live Status — always available, real data */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 className="campaign-detail-section-title">LIVE STATUS</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <p className="text-xs text-text-secondary" style={{ marginBottom: 2 }}>Status</p>
            <p className="text-sm font-medium text-text-primary" style={{ textTransform: 'capitalize' }}>{campaign.status.replace('-', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary" style={{ marginBottom: 2 }}>Timeline</p>
            <p className="text-sm font-medium text-text-primary">
              {formatDateShort(campaign.startDate)} – {formatDateShort(campaign.endDate)}
            </p>
          </div>
          {campaign.budget != null && (
            <div>
              <p className="text-xs text-text-secondary" style={{ marginBottom: 2 }}>Budget</p>
              <p className="text-sm font-medium text-text-primary">
                £{campaign.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })} / £{campaign.budget.toLocaleString('en-GB')}
              </p>
            </div>
          )}
        </div>

        {campaignTasks.length > 0 ? (
          <>
            <p className="text-xs text-text-secondary" style={{ marginBottom: 8 }}>
              {campaignTasks.filter((t) => t.status === 'complete').length} of {campaignTasks.length} tasks complete
            </p>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
              {(Object.entries(statusCounts) as [TaskStatus, number][]).map(([status, count]) => (
                <span key={status} className={`badge badge-${status}`} style={{ fontSize: 11 }}>
                  {STATUS_LABEL[status]} ({count})
                </span>
              ))}
            </div>

            {nextActions.length > 0 && (
              <>
                <p className="text-xs font-semibold text-text-secondary" style={{ marginBottom: 6 }}>NEXT ACTIONS</p>
                <div className="space-y-1" style={{ marginBottom: '0.5rem' }}>
                  {nextActions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTask(t.id)}
                      className="w-full text-left flex items-center justify-between"
                      style={{ padding: '4px 0', fontSize: 12 }}
                    >
                      <span className="text-text-primary truncate">{t.title}</span>
                      <span className="text-text-secondary" style={{ flexShrink: 0, marginLeft: 8 }}>
                        {t.deadline ? formatDateShort(t.deadline) : '—'}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-text-secondary">No tasks linked to this campaign yet.</p>
        )}
      </div>

      <div className="campaign-detail-divider" />

      {/* Original Plan — static reference document, muted/read-only styling */}
      <div>
        <h3 className="campaign-detail-section-title">ORIGINAL PLAN</h3>
        {plan ? (
          <div style={{ opacity: 0.85 }}>
            <p className="text-xs text-text-secondary italic" style={{ marginBottom: '0.75rem' }}>
              Static reference from the original plan document — not live-synced. Compare against Live Status above.
            </p>
            {plan.sections.map((section, i) => (
              <PlanSectionView key={section.title + i} section={section} defaultOpen={i === 0} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No plan document uploaded for this campaign yet.</p>
        )}
      </div>
    </div>
  );
}
