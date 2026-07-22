interface Employee {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: string;
  accent_color: string;
}

interface EmployeeCardProps {
  employee: Employee;
  isSelected: boolean;
  onSelect: () => void;
  taskCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-900 text-green-200',
  working: 'bg-blue-900 text-blue-200',
  waiting_approval: 'bg-yellow-900 text-yellow-200',
  blocked: 'bg-red-900 text-red-200',
  has_assigned_work: 'bg-blue-900 text-blue-200',
};

export function EmployeeCard({ employee, isSelected, onSelect, taskCount }: EmployeeCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition border-2 ${
        isSelected
          ? 'bg-gray-700 border-blue-500'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{employee.emoji}</div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[employee.status] || 'bg-gray-700'}`}>
          {employee.status.replace(/_/g, ' ')}
        </span>
      </div>
      <h3 className="font-bold text-lg">{employee.name}</h3>
      <p className="text-sm text-gray-400 mb-3">{employee.role}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
        {isSelected && <span className="text-blue-400">✓</span>}
      </div>
    </div>
  );
}
