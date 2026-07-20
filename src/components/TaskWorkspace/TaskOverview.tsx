import { useState } from 'react';
import * as api from '@/services/api';
import { DelegationDialog } from './DelegationDialog';
import { TaskCompletion } from './TaskCompletion';

interface TaskOverviewProps {
  workspace: any;
  currentUserId: string;
  onUpdate: () => void;
}

export function TaskOverview({ workspace, currentUserId, onUpdate }: TaskOverviewProps) {
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);

  const handleDelegate = async (employeeId: string, employeeName: string) => {
    try {
      await api.delegateTask(workspace.task.id, employeeId, currentUserId);
      onUpdate();
    } catch (err) {
      console.error('Failed to delegate task:', err);
      alert('Failed to delegate task');
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="space-y-8">
        {/* Task Details */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-slate-50 mb-4">Task Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Title</label>
              <p className="text-slate-100 font-medium mt-1">{workspace.task.title}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Priority</label>
              <p className="text-slate-100 font-medium mt-1 capitalize">{workspace.task.priority}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Status</label>
              <p className="text-slate-100 font-medium mt-1 capitalize">{workspace.task.status}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Created</label>
              <p className="text-slate-100 font-medium mt-1">
                {new Date(workspace.task.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {workspace.task.description && (
            <div className="mt-6">
              <label className="text-sm text-slate-400">Description</label>
              <p className="text-slate-200 mt-2">{workspace.task.description}</p>
            </div>
          )}
        </div>

        {/* Delegation Section */}
        {!workspace.conversation?.delegated_to_id && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-slate-50 mb-4">👤 Delegate to Specialist</h2>
            <p className="text-slate-400 mb-4">
              Choose a specialist to help. They'll have access to this task and can collaborate with you.
            </p>
            <button
              onClick={() => setShowDelegationDialog(true)}
              className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
            >
              Select Specialist
            </button>
          </div>
        )}

        {/* Delegated To Info */}
        {workspace.conversation?.delegated_to_id && (
          <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-700/50">
            <h2 className="text-xl font-bold text-slate-50 mb-4">Delegated</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{workspace.conversation.delegated_to_emoji || '👤'}</div>
              <div>
                <p className="text-slate-100 font-medium">{workspace.conversation.delegated_to_name}</p>
                <p className="text-sm text-slate-400">Assigned on {new Date(workspace.conversation.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">
              Go to the Conversation tab to work with this specialist.
            </p>

            {/* Task Completion */}
            {workspace.task.status !== 'complete' && (
              <TaskCompletion
                taskId={workspace.task.id}
                taskTitle={workspace.task.title}
                specialistName={workspace.conversation.delegated_to_name}
                specialistId={workspace.conversation.delegated_to_id}
                currentUserId={currentUserId}
                onComplete={onUpdate}
              />
            )}

            {workspace.task.status === 'complete' && (
              <div className="bg-green-900/20 border border-green-700/50 rounded p-4 mt-4">
                <p className="text-sm text-green-200 font-medium">✓ Task completed</p>
                <p className="text-xs text-green-300 mt-1">
                  {workspace.task.completed_at
                    ? `Finished on ${new Date(workspace.task.completed_at).toLocaleDateString()}`
                    : 'Completed'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {workspace.messages && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Messages</p>
              <p className="text-2xl font-bold text-slate-50 mt-2">{workspace.messages.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Drafts</p>
              <p className="text-2xl font-bold text-slate-50 mt-2">{workspace.drafts?.length || 0}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Outputs</p>
              <p className="text-2xl font-bold text-slate-50 mt-2">{workspace.outputs?.length || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Delegation Dialog */}
      <DelegationDialog
        taskId={workspace.task.id}
        isOpen={showDelegationDialog}
        onClose={() => setShowDelegationDialog(false)}
        onDelegate={handleDelegate}
        currentUserId={currentUserId}
      />
    </div>
  );
}
