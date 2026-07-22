import React, { useState } from 'react';
import * as api from '../../services/api';

interface SpecialistAIDelegationProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  aiName: string;
  aiEmployeeId: string;
  reason: string;
  canAutoHandle: boolean;
  onDelegationComplete?: () => void;
}

export default function SpecialistAIDelegation({
  taskId,
  taskTitle,
  taskDescription,
  aiName,
  aiEmployeeId,
  reason,
  canAutoHandle,
  onDelegationComplete,
}: SpecialistAIDelegationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [decision, setDecision] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelegate = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const result = await api.delegateTaskToAI(aiEmployeeId, taskId, reason);
      setDecision(result);
      onDelegationComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delegate task');
    } finally {
      setIsProcessing(false);
    }
  };

  if (decision) {
    const statusColor =
      decision.decision === 'approved'
        ? 'bg-green-50 border-green-200'
        : decision.decision === 'rejected'
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200';

    const statusLabel =
      decision.decision === 'approved'
        ? '✓ Approved'
        : decision.decision === 'rejected'
          ? '✗ Rejected'
          : '⏳ Pending Review';

    return (
      <div className={`border rounded-lg p-4 ${statusColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{aiName} - {statusLabel}</h4>
            <p className="text-sm text-gray-700 mb-2">{decision.reason}</p>
            {decision.recommendation && (
              <p className="text-sm text-gray-600 italic">
                Next: {decision.recommendation}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{aiName}</h4>
          <p className="text-sm text-gray-600">{reason}</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">Error: {error}</div>}

      <button
        onClick={handleDelegate}
        disabled={isProcessing}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Delegate to ${aiName}`}
      </button>
    </div>
  );
}
