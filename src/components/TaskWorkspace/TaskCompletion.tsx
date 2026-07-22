import { useState } from 'react';
import * as api from '@/services/api';

interface TaskCompletionProps {
  taskId: string;
  taskTitle: string;
  specialistName: string;
  specialistId: string;
  currentUserId: string;
  onComplete: () => void;
}

export function TaskCompletion({
  taskId,
  taskTitle,
  specialistName,
  specialistId,
  currentUserId,
  onComplete,
}: TaskCompletionProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [completing, setCompleting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Mark task as complete
      await api.updateTaskStatus(taskId, 'complete', currentUserId);

      // Save specialist feedback if provided
      if (feedback.trim()) {
        // In a real system, this would save learning feedback
        console.log('Feedback saved:', { rating, feedback });
      }

      onComplete();
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert('Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
      >
        ✓ Mark Task Complete
      </button>
    );
  }

  return (
    <div className="bg-green-900/20 border-l-4 border-green-600 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-50 mb-4">✓ Complete Task</h3>

      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          You're about to mark <strong>{taskTitle}</strong> as complete. Help {specialistName} improve by
          sharing feedback.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            How did {specialistName} do?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl transition-transform transform hover:scale-110 ${
                  star <= rating ? 'text-yellow-400' : 'text-slate-600'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {rating === 1 && 'Needs improvement'}
            {rating === 2 && 'Below expectations'}
            {rating === 3 && 'Meets expectations'}
            {rating === 4 && 'Exceeds expectations'}
            {rating === 5 && 'Excellent work!'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Feedback (Optional but helpful)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`e.g., "${specialistName}, great work on the tone! Next time, try being more concise." or "Perfect! Just what we needed."`}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Your feedback helps {specialistName} learn and improve for future tasks.
          </p>
        </div>

        <div className="bg-green-900/10 border border-green-700/30 rounded p-3">
          <p className="text-sm text-green-200">
            ✓ This task will be marked as complete and {specialistName} will receive your feedback.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {completing ? 'Completing...' : '✓ Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
