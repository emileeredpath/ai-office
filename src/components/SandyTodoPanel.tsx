import { useState } from 'react';
import { ListTodo, ChevronDown, ChevronUp } from 'lucide-react';
import { useOfficeStore } from '@/store/officeStore';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/types/employee';

export function SandyTodoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const employees = useOfficeStore((state) => state.employees);

  const allActiveTasks = employees
    .flatMap((emp) =>
      emp.tasks
        .filter((t) => t.status !== 'complete')
        .map((task) => ({ ...task, employee: emp.name, employeeEmoji: emp.emoji }))
    )
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-52 z-30 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        style={{
          backgroundColor: '#2E3B4A',
          color: '#F0F4F8',
          border: '1px solid #3a4f6a',
        }}
        title="Sandy's full to-do list"
      >
        <ListTodo size={18} />
        <span className="text-sm font-medium">Sandy's To-Do ({allActiveTasks.length})</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-52 z-40 w-96 max-h-[70vh] flex flex-col rounded-lg shadow-2xl border"
      style={{ backgroundColor: '#1D2A3A', borderColor: '#3a4f6a' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2E3B4A' }}>
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-[#F9701F]" />
          <h3 className="font-bold text-[#F0F4F8] text-sm">Sandy's To-Do List</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-[#8F9194] hover:text-[#F0F4F8]">
          <ChevronDown size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allActiveTasks.length === 0 ? (
          <p className="text-xs text-[#8F9194] text-center py-6">Nothing on Sandy's list yet</p>
        ) : (
          allActiveTasks.map((task) => (
            <div
              key={task.id}
              className="p-2 rounded border-l-2"
              style={{ backgroundColor: '#111B26', borderColor: TASK_STATUS_COLORS[task.status] }}
            >
              <p className="text-xs font-medium text-[#F0F4F8] line-clamp-2">{task.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[#8F9194]">
                  {task.employeeEmoji} {task.employee}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${TASK_STATUS_COLORS[task.status]}33`,
                    color: TASK_STATUS_COLORS[task.status],
                  }}
                >
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
