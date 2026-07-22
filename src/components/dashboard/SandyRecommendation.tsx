import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface Recommendation {
  type: 'task_assignment' | 'task_creation' | 'process_improvement';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => Promise<void>;
  loading?: boolean;
}

interface SandyRecommendationProps {
  recommendation: Recommendation;
  onDismiss: () => void;
}

export function SandyRecommendation({ recommendation, onDismiss }: SandyRecommendationProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!recommendation.onAction) return;
    setLoading(true);
    try {
      await recommendation.onAction();
      onDismiss();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor =
    recommendation.type === 'task_assignment'
      ? 'bg-blue-900 border-blue-700'
      : recommendation.type === 'task_creation'
        ? 'bg-green-900 border-green-700'
        : 'bg-purple-900 border-purple-700';

  const typeLabel =
    recommendation.type === 'task_assignment'
      ? '📋 Assignment'
      : recommendation.type === 'task_creation'
        ? '✨ New Task'
        : '🔧 Improvement';

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-3`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-blue-300">{typeLabel}</span>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
      <h4 className="font-semibold mb-1">{recommendation.title}</h4>
      <p className="text-sm text-gray-300 mb-3">{recommendation.description}</p>
      {recommendation.actionLabel && (
        <Button
          size="sm"
          onClick={handleAction}
          disabled={loading}
          className="w-full"
        >
          {loading ? '...' : recommendation.actionLabel}
        </Button>
      )}
    </div>
  );
}
