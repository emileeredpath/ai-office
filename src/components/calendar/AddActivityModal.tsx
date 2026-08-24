import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Task, Brand, TaskPriority } from '@/types/index';

interface AddActivityModalProps {
  defaultDate?: Date | null;
  onClose: () => void;
}

const toDateInput = (d: Date) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// "+ Add Activity" on Content & Calendar. Deliberately not labelled
// "New Content" — there is no content-type/social-platform data model in
// this app, so this reuses the exact same Task creation the rest of the
// app already has (same fields as AddTaskModal), just pre-filling the
// deadline from whichever calendar date was clicked.
export function AddActivityModal({ defaultDate, onClose }: AddActivityModalProps) {
  const addTask = useAppStore((s) => s.addTask);
  const campaigns = useAppStore((s) => s.campaigns);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    brand: 'brentwood' as Brand,
    priority: 'medium' as TaskPriority,
    deadline: defaultDate ? toDateInput(defaultDate) : '',
    campaignId: '',
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('A title is required');
      return;
    }

    const newTask: Task = {
      id: 'task-' + Date.now(),
      title: formData.title,
      notes: formData.notes,
      brand: formData.brand,
      status: 'not-started',
      priority: formData.priority,
      deadline: formData.deadline ? new Date(formData.deadline) : null,
      startDate: null,
      campaignId: formData.campaignId || null,
      scheduleId: null,
      createdAt: new Date(),
      completedAt: null,
      previousStatus: null,
      history: [],
      approvalRequired: false,
      approver: null,
      blockerReason: null,
      lastBriefGenerated: null,
      type: 'task',
      recipients: null,
      subject: null,
      cost: null,
      currency: null,
      opens: null,
      clicks: null,
      openRate: null,
      clickRate: null,
      bounces: null,
      unsubscribes: null,
      externalId: null,
    };

    setIsSaving(true);
    try {
      await addTask(newTask);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 200 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Activity</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. LinkedIn post — Q3 Education Campaign"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Entity</label>
            <select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value as Brand })} className="input">
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
              <option value="idaro">IDARO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Date</label>
            <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Campaign</label>
            <select value={formData.campaignId} onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })} className="input">
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })} className="input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes..."
              className="input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isSaving} className="btn btn-primary flex-1 disabled:opacity-60">
              {isSaving ? 'Adding…' : 'Add Activity'}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
