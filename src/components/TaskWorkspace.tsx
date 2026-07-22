import { useState, useEffect } from 'react';
import * as api from '@/services/api';
import { TaskOverview } from './TaskWorkspace/TaskOverview';
import { TaskConversation } from './TaskWorkspace/TaskConversation';
import { TaskDrafts } from './TaskWorkspace/TaskDrafts';
import { TaskOutputs } from './TaskWorkspace/TaskOutputs';
import { TaskFiles } from './TaskWorkspace/TaskFiles';
import { TaskHistory } from './TaskWorkspace/TaskHistory';

type Tab = 'overview' | 'conversation' | 'drafts' | 'outputs' | 'files' | 'history';

interface TaskWorkspaceProps {
  taskId: string;
  currentUserId: string;
}

export function TaskWorkspace({ taskId, currentUserId }: TaskWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspace();
  }, [taskId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const data = await api.getTaskWorkspace(taskId);
      setWorkspace(data);
      setError(null);
    } catch (err) {
      setError('Failed to load task workspace');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">No task data</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">{workspace.task.title}</h1>
            <p className="text-sm text-slate-400 mt-1">{workspace.task.description}</p>
          </div>
          <div className="flex gap-2">
            {workspace.conversation?.delegated_to_name && (
              <div className="px-3 py-1 rounded-lg bg-orange-900/30 border border-orange-700/50 text-sm text-orange-200">
                Delegated to {workspace.conversation.delegated_to_name}
              </div>
            )}
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              workspace.task.status === 'complete'
                ? 'bg-green-900/30 border border-green-700/50 text-green-200'
                : workspace.task.status === 'in_progress'
                ? 'bg-blue-900/30 border border-blue-700/50 text-blue-200'
                : 'bg-slate-700/50 border border-slate-600 text-slate-200'
            }`}>
              {workspace.task.status}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-700">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'conversation', label: 'Conversation' },
              { id: 'drafts', label: 'Drafts' },
              { id: 'outputs', label: 'Outputs' },
              { id: 'files', label: 'Files' },
              { id: 'history', label: 'History' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <TaskOverview
            workspace={workspace}
            currentUserId={currentUserId}
            onUpdate={loadWorkspace}
          />
        )}
        {activeTab === 'conversation' && (
          <TaskConversation
            workspace={workspace}
            taskId={taskId}
            currentUserId={currentUserId}
            onUpdate={loadWorkspace}
          />
        )}
        {activeTab === 'drafts' && (
          <TaskDrafts workspace={workspace} taskId={taskId} currentUserId={currentUserId} onUpdate={loadWorkspace} />
        )}
        {activeTab === 'outputs' && (
          <TaskOutputs
            workspace={workspace}
            taskId={taskId}
            currentUserId={currentUserId}
            onUpdate={loadWorkspace}
          />
        )}
        {activeTab === 'files' && (
          <TaskFiles workspace={workspace} taskId={taskId} currentUserId={currentUserId} />
        )}
        {activeTab === 'history' && (
          <TaskHistory workspace={workspace} />
        )}
      </div>
    </div>
  );
}
