import { X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Task, Brand, TaskPriority } from '@/types/index';

interface AddTaskModalProps {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const addTask = useAppStore((s) => s.addTask);
  const campaigns = useAppStore((s) => s.campaigns);

  const [formData, setFormData] = useState({
    title: '',
    brand: 'brentwood' as Brand,
    priority: 'medium' as TaskPriority,
    deadline: '',
    campaignId: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Task title is required');
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
      createdAt: new Date(),
      completedAt: null,
      previousStatus: null,
      history: [],
      approvalRequired: false,
      approver: null,
      blockerReason: null,
      lastBriefGenerated: null,
    };

    addTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Task</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Task title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className="input"
              autoFocus
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Brand</label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value as Brand })}
              className="input"
            >
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input"
            />
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Campaign</label>
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="input"
            >
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="btn btn-primary flex-1">
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
