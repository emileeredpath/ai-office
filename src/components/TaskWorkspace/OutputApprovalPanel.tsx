import { useState } from 'react';
import * as api from '@/services/api';

interface OutputApprovalPanelProps {
  taskId: string;
  draftId: string;
  draftTitle: string;
  draftContent: string;
  currentUserId: string;
  onApprove: () => void;
  onCancel: () => void;
}

export function OutputApprovalPanel({
  taskId,
  draftId,
  draftTitle,
  draftContent,
  currentUserId,
  onApprove,
  onCancel,
}: OutputApprovalPanelProps) {
  const [feedback, setFeedback] = useState('');
  const [approving, setApproving] = useState(false);
  const [outputType, setOutputType] = useState('document');

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.approveDraft(taskId, draftId, currentUserId, outputType);

      // Save feedback if provided
      if (feedback.trim()) {
        // Save feedback as a note or preference
        // For now, just log it
        console.log('Feedback:', feedback);
      }

      onApprove();
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve output');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="bg-green-900/20 border-l-4 border-green-600 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-50 mb-4">✓ Approve as Output</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Output Title</label>
          <input
            type="text"
            defaultValue={draftTitle}
            disabled
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Output Type</label>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="document">Document</option>
            <option value="email">Email Copy</option>
            <option value="social_post">Social Media Post</option>
            <option value="webpage">Web Page</option>
            <option value="proposal">Proposal</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Feedback (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Help the specialist improve future responses
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., 'Great work! More emojis next time' or 'Too formal, make it casual'"
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
        </div>

        <div className="bg-green-900/10 border border-green-700/30 rounded p-3">
          <p className="text-sm text-green-200">
            ✓ This will create a permanent output linked to this task. The specialist will learn from your feedback.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {approving ? 'Approving...' : '✓ Approve & Create Output'}
          </button>
        </div>
      </div>
    </div>
  );
}
