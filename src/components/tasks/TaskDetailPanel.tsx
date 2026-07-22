import { useState, useEffect } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BriefGenerator } from '@/components/tasks/BriefGenerator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate } from '@/utils/dateUtils';
import '@/styles/taskDetailPanel.css';

export function TaskDetailPanel() {
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const getTaskById = useAppStore((s) => s.getTaskById);
  const updateTask = useAppStore((s) => s.updateTask);
  const selectTask = useAppStore((s) => s.selectTask);
  const getCampaignById = useAppStore((s) => s.getCampaignById);
  const campaigns = useAppStore((s) => s.campaigns);

  const task = selectedTaskId ? getTaskById(selectedTaskId) : null;
  const campaign = task?.campaignId ? getCampaignById(task.campaignId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(task?.notes || '');

  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
    }
  }, [selectedTaskId, task]);

  if (!task) return null;

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    // Auto-save with debounce
    setTimeout(() => {
      updateTask(task.id, { notes: newNotes });
    }, 500);
  };

  return (
    <div className="task-detail-panel">
      {/* Header */}
      <div className="task-detail-header">
        <button className="btn-close" onClick={() => selectTask(null)}>
          <X size={20} />
        </button>
        <button className="btn-more">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="task-detail-content">
        {/* Title */}
        <h1 className="task-detail-title">{task.title}</h1>

        {/* Field Row 1 */}
        <div className="task-detail-fields">
          <div className="task-detail-field">
            <label>Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
              className="input"
            >
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-approval">Waiting Approval</option>
              <option value="waiting-john">Waiting for John</option>
              <option value="waiting-customer">Waiting Customer</option>
              <option value="approved-ready">Approved Ready</option>
              <option value="blocked">Blocked</option>
              <option value="complete">Complete</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>

          <div className="task-detail-field">
            <label>Brand</label>
            <select
              value={task.brand}
              onChange={(e) => updateTask(task.id, { brand: e.target.value as any })}
              className="input"
            >
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
            </select>
          </div>

          <div className="task-detail-field">
            <label>Due date</label>
            <input
              type="date"
              value={task.deadline ? task.deadline.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                updateTask(task.id, {
                  deadline: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="input"
            />
          </div>
        </div>

        {/* Field Row 2 */}
        <div className="task-detail-fields">
          <div className="task-detail-field">
            <label>Priority</label>
            <select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="task-detail-field">
            <label>Campaign</label>
            <select
              value={task.campaignId || ''}
              onChange={(e) =>
                updateTask(task.id, {
                  campaignId: e.target.value || null,
                })
              }
              className="input"
            >
              <option value="">None</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="task-detail-divider"></div>

        {/* Notes */}
        <div>
          <h3 className="task-detail-section-title">NOTES</h3>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add notes for this task..."
            className="task-detail-textarea"
          />
        </div>

        {/* Divider */}
        <div className="task-detail-divider"></div>

        {/* Brief Generator */}
        <BriefGenerator task={task} campaign={campaign} />

        {/* Divider */}
        <div className="task-detail-divider"></div>

        {/* Activity */}
        <div>
          <h3 className="task-detail-section-title">ACTIVITY</h3>
          <p className="text-text-secondary text-sm">
            Task created on {formatDate(task.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
