import { useState } from 'react';
import { Play, MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Employee, Task, TaskStatus } from '@/types/employee';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/types/employee';
import { useOfficeStore } from '@/store/officeStore';
import { SpeechBubble } from './SpeechBubble';

interface PersonCardProps {
  employee: Employee;
  isAssigning?: boolean;
  suggestion?: string;
}

const MANUAL_STATUS_OPTIONS: TaskStatus[] = [
  'waiting_john_approval',
  'waiting_customer',
  'blocked',
  'complete',
];

function TaskRow({ employeeId, task }: { employeeId: string; task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const startTask = useOfficeStore((s) => s.startTask);
  const setTaskStatus = useOfficeStore((s) => s.setTaskStatus);
  const completeTask = useOfficeStore((s) => s.completeTask);
  const addTaskNote = useOfficeStore((s) => s.addTaskNote);

  const statusColor = TASK_STATUS_COLORS[task.status];

  return (
    <div
      className="rounded border-l-2 p-2"
      style={{ backgroundColor: '#111B26', borderColor: statusColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left"
        >
          <p className="text-xs font-medium text-[#F0F4F8] line-clamp-2">{task.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${statusColor}33`, color: statusColor }}
            >
              {TASK_STATUS_LABELS[task.status]}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded capitalize"
              style={{
                backgroundColor:
                  task.priority === 'high'
                    ? 'rgba(255, 107, 107, 0.2)'
                    : task.priority === 'medium'
                      ? 'rgba(249, 112, 31, 0.2)'
                      : 'rgba(76, 175, 80, 0.2)',
                color: task.priority === 'high' ? '#FF6B6B' : task.priority === 'medium' ? '#F9701F' : '#4CAF50',
              }}
            >
              {task.priority}
            </span>
          </div>
        </button>
        <button onClick={() => setExpanded((v) => !v)} className="text-[#8F9194] flex-shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#2E3B4A] space-y-2">
          {/* Controls */}
          <div className="flex flex-wrap gap-1.5">
            {task.status !== 'in_progress' && task.status !== 'complete' && (
              <button
                onClick={() => startTask(employeeId, task.id)}
                className="text-xs px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: 'rgba(249, 112, 31, 0.2)', color: '#F9701F' }}
              >
                <Play size={10} /> Start
              </button>
            )}
            {MANUAL_STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() =>
                  status === 'complete'
                    ? completeTask(employeeId, task.id)
                    : setTaskStatus(employeeId, task.id, status)
                }
                disabled={task.status === status}
                className="text-xs px-2 py-1 rounded disabled:opacity-40"
                style={{
                  backgroundColor: `${TASK_STATUS_COLORS[status]}22`,
                  color: TASK_STATUS_COLORS[status],
                }}
              >
                {TASK_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          {/* Notes */}
          {task.notes.length > 0 && (
            <div className="space-y-1">
              {task.notes.map((note) => (
                <p key={note.id} className="text-xs text-[#8F9194] italic">
                  “{note.text}”
                </p>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add note..."
              className="flex-1 text-xs px-2 py-1 rounded focus:outline-none"
              style={{ backgroundColor: '#1D2A3A', color: '#F0F4F8', border: '1px solid #3a4f6a' }}
            />
            <button
              onClick={() => {
                if (!noteText.trim()) return;
                addTaskNote(employeeId, task.id, noteText.trim());
                setNoteText('');
              }}
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: '#2E3B4A', color: '#F0F4F8' }}
              title="Add note"
            >
              <MessageSquarePlus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PersonCard({ employee, isAssigning, suggestion }: PersonCardProps) {
  const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
  const statusLabel = EMPLOYEE_STATUS_LABELS[employee.status];

  const activeTasks = employee.tasks.filter((t) => t.status !== 'complete');
  const speakingTask = activeTasks.find((t) => t.status === 'in_progress') ?? activeTasks[0];

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg relative group transition-all hover:shadow-lg"
      style={{
        backgroundColor: '#1D2A3A',
        border: `2px solid ${isAssigning ? statusColor : 'transparent'}`,
      }}
    >
      {/* Speech bubble for active task */}
      {speakingTask && (
        <div className="absolute -top-20 w-full px-2">
          <SpeechBubble message={speakingTask.title} type="task" accentColor={statusColor} />
        </div>
      )}

      {/* Suggestion bubble */}
      {suggestion && !speakingTask && (
        <div className="absolute -top-20 w-full px-2">
          <SpeechBubble message={suggestion} type="status" accentColor={statusColor} />
        </div>
      )}

      {/* Desk/Workspace */}
      <div className="flex items-start gap-3">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 relative"
          style={{ backgroundColor: '#111B26', border: `2px solid ${statusColor}` }}
        >
          {employee.emoji}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full border-2 border-[#1D2A3A] animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div>
            <h3 className="font-semibold text-sm text-[#F0F4F8] truncate">{employee.name}</h3>
            <p className="text-xs text-[#8F9194]">{employee.role}</p>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {employee.personality.slice(0, 2).map((trait, idx) => (
              <span
                key={idx}
                className="text-xs px-1.5 py-0.5 rounded text-[#F0F4F8] line-clamp-1"
                style={{ backgroundColor: 'rgba(249, 112, 31, 0.15)' }}
              >
                {trait}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-xs font-medium text-[#F0F4F8]">{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Task Queue */}
      {activeTasks.length > 0 ? (
        <div>
          <p className="text-xs text-[#8F9194] uppercase mb-2">
            Queue ({activeTasks.length})
          </p>
          <div className="space-y-1.5">
            {activeTasks.map((task) => (
              <TaskRow key={task.id} employeeId={employee.id} task={task} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#8F9194] text-center py-2">Waiting for Sandy</p>
      )}

      {isAssigning && (
        <div className="absolute inset-0 rounded-lg border-2 border-[#F9701F] animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
