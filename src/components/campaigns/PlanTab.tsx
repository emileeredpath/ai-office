import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Upload, Trash2 } from 'lucide-react';
import { CAMPAIGN_PLAN_MARKDOWN } from '@/data/campaignPlans';
import { parsePlanMarkdown, PlanSection } from '@/utils/planMarkdown';
import { formatDateShort } from '@/utils/dateUtils';
import { Campaign, Task, TaskStatus, PlanDocument } from '@/types/index';
import ReactMarkdown from 'react-markdown';

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

export function PlanTab({ campaign, campaignTasks, onSelectTask, onUpdateCampaign }: { campaign: Campaign; campaignTasks: Task[]; onSelectTask: (id: string) => void; onUpdateCampaign: (id: string, updates: Partial<Campaign>) => void }) {
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('Campaign planDocument updated:', campaign.planDocument ? campaign.planDocument.filename : 'none');
  }, [campaign.planDocument]);

  const handleUploadClick = () => {
    console.log('Upload clicked');
    fileInputRef.current?.click();
  };

  const markdown = CAMPAIGN_PLAN_MARKDOWN[campaign.id];
  const plan = markdown ? parsePlanMarkdown(markdown) : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      // Only support markdown files
      if (!file.name.endsWith('.md')) {
        setUploadError('Only .md (markdown) files are supported');
        setIsUploading(false);
        return;
      }

      // Validate file size (1MB max)
      const maxSize = 1 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size must be less than 1MB. Your file is too large.');
        setIsUploading(false);
        return;
      }

      const content = await file.text();
      console.log('File content read, length:', content.length);
      const planDoc: PlanDocument = {
        filename: file.name,
        content,
        uploadDate: new Date(),
        fileType: 'markdown',
      };

      console.log('Calling onUpdateCampaign with planDocument:', planDoc.filename);
      await onUpdateCampaign(campaign.id, { planDocument: planDoc });
      console.log('onUpdateCampaign completed');
      setUploadError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error uploading file. Please try again.';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
      // Reset the input so selecting the same file again triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePlan = () => {
    if (window.confirm('Remove the plan document? This cannot be undone.')) {
      onUpdateCampaign(campaign.id, { planDocument: undefined });
    }
  };

  const statusCounts = campaignTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Partial<Record<TaskStatus, number>>);

  const nextActions = campaignTasks
    .filter((t) => t.status !== 'complete' && t.deadline)
    .sort((a, b) => new Date(a.deadline as Date).getTime() - new Date(b.deadline as Date).getTime())
    .slice(0, 5);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
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

      {/* Uploaded Plan Document */}
      <div>
        <h3 className="campaign-detail-section-title">UPLOADED PLAN</h3>
        {campaign.planDocument ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
              <div>
                <p className="text-xs font-semibold text-text-primary" style={{ marginBottom: 4 }}>{campaign.planDocument.filename}</p>
                <p className="text-xs text-text-secondary">
                  Uploaded {formatDateShort(campaign.planDocument.uploadDate)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: isUploading ? '#ccc' : 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={14} />
                  {isUploading ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleRemovePlan}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>

            {campaign.planDocument.fileType === 'markdown' ? (
              <div style={{
                backgroundColor: '#fafafa',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '16px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--color-text-primary)',
                maxHeight: '600px',
                overflowY: 'auto',
              }}>
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', marginTop: '16px' }} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', marginTop: '14px' }} {...props} />,
                    h3: ({ node, ...props }) => <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', marginTop: '12px' }} {...props} />,
                    p: ({ node, ...props }) => <p style={{ marginBottom: '12px' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ marginLeft: '20px', marginBottom: '12px', listStyle: 'disc' }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ marginLeft: '20px', marginBottom: '12px', listStyle: 'decimal' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                    code: ({ node, ...props }) => <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px' }} {...props} />,
                    pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '4px', overflowX: 'auto', marginBottom: '12px' }} {...props} />,
                    a: ({ node, ...props }) => <a style={{ color: 'var(--color-accent)', textDecoration: 'underline' }} {...props} />,
                    table: ({ node, ...props }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }} {...props} />,
                    th: ({ node, ...props }) => <th style={{ border: '1px solid var(--color-border)', padding: '8px', textAlign: 'left', fontWeight: 'bold', backgroundColor: 'var(--color-bg-secondary)' }} {...props} />,
                    td: ({ node, ...props }) => <td style={{ border: '1px solid var(--color-border)', padding: '8px' }} {...props} />,
                  }}
                >
                  {campaign.planDocument.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f5f5f5',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}>
                <p className="text-sm">PDF preview not yet available</p>
                <p className="text-xs" style={{ marginTop: '8px' }}>File: {campaign.planDocument.filename}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px dashed var(--color-border)' }}>
            <Upload size={32} style={{ marginBottom: '12px', color: 'var(--color-text-secondary)' }} />
            <p className="text-sm text-text-primary" style={{ marginBottom: '8px', fontWeight: 500 }}>No plan document uploaded yet</p>
            <p className="text-xs text-text-secondary" style={{ marginBottom: '12px' }}>Upload a markdown (.md) file to share with your team</p>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{
                padding: '8px 16px',
                backgroundColor: isUploading ? '#ccc' : 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Plan'}
            </button>
          </div>
        )}

        {uploadError && (
          <p style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00', fontSize: '12px' }}>
            {uploadError}
          </p>
        )}

      </div>

      {plan && (
        <>
          <div className="campaign-detail-divider" />

          {/* Original Plan — static reference document, muted/read-only styling */}
          <div>
            <h3 className="campaign-detail-section-title">ORIGINAL PLAN</h3>
            <div style={{ opacity: 0.85 }}>
              <p className="text-xs text-text-secondary italic" style={{ marginBottom: '0.75rem' }}>
                Static reference from the original plan document — not live-synced. Compare against Live Status above.
              </p>
              {plan.sections.map((section, i) => (
                <PlanSectionView key={section.title + i} section={section} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}
