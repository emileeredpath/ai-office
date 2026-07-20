import { useState, useEffect } from 'react';
import * as api from '@/services/api';
import { TaskWorkspace } from './TaskWorkspace';

interface MyTasksProps {
  companyId: string;
  currentUserId: string;
}

export function MyTasks({ companyId, currentUserId }: MyTasksProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
  });

  useEffect(() => {
    loadTasks();
  }, [companyId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await api.getTasks(companyId);
      setTasks(tasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const newTask = await api.createTask(companyId, {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
      });
      setTasks([newTask, ...tasks]);
      setFormData({ title: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/30 border-red-700/50 text-red-200';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200';
      case 'low':
        return 'bg-blue-900/30 border-blue-700/50 text-blue-200';
      default:
        return 'bg-slate-700/30 border-slate-600/50 text-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-900/30 border-green-700/50 text-green-200';
      case 'in_progress':
        return 'bg-blue-900/30 border-blue-700/50 text-blue-200';
      case 'waiting_review':
        return 'bg-orange-900/30 border-orange-700/50 text-orange-200';
      case 'assigned':
        return 'bg-purple-900/30 border-purple-700/50 text-purple-200';
      default:
        return 'bg-slate-700/30 border-slate-600/50 text-slate-200';
    }
  };

  // If a task is selected, show the workspace
  if (selectedTaskId) {
    return (
      <div className="h-full flex flex-col bg-slate-950">
        {/* Back button */}
        <div className="border-b border-slate-800 bg-slate-900 p-4">
          <button
            onClick={() => setSelectedTaskId(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            ← Back to My Tasks
          </button>
        </div>
        {/* Task workspace */}
        <div className="flex-1">
          <TaskWorkspace taskId={selectedTaskId} currentUserId={currentUserId} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">My Tasks</h1>
            <p className="text-slate-400 mt-1">Create, manage, and delegate your work</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {/* Create Task Form */}
        {showCreateForm && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-50 mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details, context, or requirements..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:outline-none focus:border-orange-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.title.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Stats */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-50 mt-2">{tasks.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">In Progress</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">
                {tasks.filter((t) => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Waiting Review</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">
                {tasks.filter((t) => t.status === 'waiting_review').length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {tasks.filter((t) => t.status === 'complete').length}
              </p>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-slate-400 text-lg mb-4">No tasks yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first task to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              Create First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-50 flex-1">{task.title}</h3>
                  <div className="flex gap-2 ml-4">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div>
                    {task.employee_name && (
                      <span>Assigned to {task.employee_name}</span>
                    )}
                  </div>
                  <span>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
