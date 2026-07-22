import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface DelegationDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelegate: (employeeId: string, employeeName: string) => void;
  currentUserId: string;
}

export function DelegationDialog({
  taskId,
  isOpen,
  onClose,
  onDelegate,
  currentUserId,
}: DelegationDialogProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [delegating, setDelegating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSpecialists();
    }
  }, [isOpen]);

  const loadSpecialists = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data. In a real app, fetch from API
      // const specialists = await api.getEmployees(companyId);
      // Filter to only AI employees (specialists)
      setEmployees([
        { id: '1', name: 'Social Media Manager', emoji: '📱', role: 'specialist' },
        { id: '2', name: 'Email Marketing Manager', emoji: '📧', role: 'specialist' },
        { id: '3', name: 'Website Manager', emoji: '🌐', role: 'specialist' },
        { id: '4', name: 'SEO & PPC Manager', emoji: '🔍', role: 'specialist' },
        { id: '5', name: 'Proposal Writer', emoji: '📝', role: 'specialist' },
        { id: '6', name: 'Case Study Writer', emoji: '📚', role: 'specialist' },
        { id: '7', name: 'Funding & Rewards Manager', emoji: '💰', role: 'specialist' },
        { id: '8', name: 'Marketing Director', emoji: '📊', role: 'specialist' },
      ]);
    } catch (err) {
      console.error('Failed to load specialists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelegate = async () => {
    if (!selectedEmployeeId) return;

    const employee = employees.find((e) => e.id === selectedEmployeeId);
    if (!employee) return;

    setDelegating(true);
    try {
      await onDelegate(selectedEmployeeId, employee.name);
      setSelectedEmployeeId('');
      onClose();
    } catch (err) {
      console.error('Failed to delegate:', err);
    } finally {
      setDelegating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full">
        <div className="border-b border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-50">Delegate Task</h2>
          <p className="text-sm text-slate-400 mt-2">Choose a specialist to help with this task</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployeeId(employee.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedEmployeeId === employee.id
                      ? 'bg-orange-600/20 border-orange-500 text-orange-200'
                      : 'bg-slate-900/50 border-slate-700 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">{employee.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">{employee.name}</p>
                  </div>
                  {selectedEmployeeId === employee.id && (
                    <span className="text-orange-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelegate}
            disabled={!selectedEmployeeId || delegating}
            className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {delegating ? 'Delegating...' : 'Delegate'}
          </button>
        </div>
      </div>
    </div>
  );
}
