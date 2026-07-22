interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const STATUS_OPTIONS = [
  'backlog',
  'assigned',
  'awaiting_brief',
  'in_progress',
  'waiting_review',
  'complete',
];

export function TaskList({ tasks, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="text-gray-400 text-center py-8">No tasks assigned</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="bg-gray-700 rounded p-3">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold">{task.title}</h4>
            <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>

          {task.description && <p className="text-sm text-gray-300 mb-2">{task.description}</p>}

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Status:</label>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
              className="bg-gray-600 text-white text-xs rounded px-2 py-1 hover:bg-gray-500 transition"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
