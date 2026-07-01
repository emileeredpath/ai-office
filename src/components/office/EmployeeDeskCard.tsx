import { MessageSquare, Share2, HelpCircle } from 'lucide-react';
import { SpeechBubble } from './SpeechBubble';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
}

interface EmployeeDeskCardProps {
  emoji: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'in-review' | 'offline' | 'idle';
  currentTask?: Task;
  workload: number;
  onChat?: () => void;
  onShare?: () => void;
  onHelp?: () => void;
}

export function EmployeeDeskCard({
  emoji,
  name,
  role,
  status,
  currentTask,
  workload,
  onChat,
  onShare,
  onHelp,
}: EmployeeDeskCardProps) {
  const statusColors = {
    available: '#4CAF50',
    busy: '#F9701F',
    'in-review': '#2196F3',
    offline: '#5A6A7A',
    idle: '#8F9194',
  };

  const priorityColors = {
    low: '#4CAF50',
    medium: '#F9701F',
    high: '#FF6B6B',
  };

  return (
    <div
      className="rounded-lg overflow-visible border shadow-lg hover:shadow-xl transition-shadow cursor-pointer group relative"
      style={{
        backgroundColor: '#1D2A3A',
        borderColor: '#3a4f6a',
      }}
    >
      {/* Speech Bubble for Current Task */}
      {currentTask && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-full px-2">
          <SpeechBubble
            message={currentTask.title}
            type="task"
            accentColor={statusColors[status]}
          />
        </div>
      )}

      {/* Card Header with Avatar */}
      <div className="relative p-4 bg-gradient-to-r from-[#2E3B4A] to-[#1D2A3A]">
        {/* Avatar */}
        <div className="flex items-end gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 shadow-md"
            style={{ borderColor: statusColors[status], backgroundColor: '#111B26' }}
          >
            {emoji}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-[#F0F4F8] text-sm">{name}</h3>
            <p className="text-xs text-[#8F9194]">{role}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColors[status] }}
          />
          <span className="text-xs text-[#8F9194] capitalize">{status}</span>
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="px-4 py-3 border-b border-[#2E3B4A]">
          <p className="text-xs text-[#8F9194] mb-1 uppercase">Current Task</p>
          <div
            className="p-2 rounded border-l-2"
            style={{
              backgroundColor: '#111B26',
              borderColor: priorityColors[currentTask.priority],
            }}
          >
            <p className="text-xs font-medium text-[#F0F4F8] line-clamp-2">
              {currentTask.title}
            </p>
            <span
              className="text-xs mt-1 inline-block px-2 py-0.5 rounded capitalize"
              style={{
                backgroundColor: priorityColors[currentTask.priority] + '22',
                color: priorityColors[currentTask.priority],
              }}
            >
              {currentTask.priority}
            </span>
          </div>
        </div>
      )}

      {/* Workload Bar */}
      <div className="px-4 py-3 border-b border-[#2E3B4A]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8F9194]">Workload</span>
          <span className="text-xs font-semibold text-[#F0F4F8]">{workload}%</span>
        </div>
        <div className="w-full bg-[#111B26] rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${workload}%`,
              backgroundColor: workload > 80 ? '#FF6B6B' : workload > 60 ? '#F9701F' : '#4CAF50',
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 bg-[#111B26] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onChat}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
          style={{
            backgroundColor: '#2E3B4A',
            color: '#F0F4F8',
          }}
          title="Team Chat"
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          onClick={onShare}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
          style={{
            backgroundColor: '#2E3B4A',
            color: '#F0F4F8',
          }}
          title="Share Update"
        >
          <Share2 size={14} />
          Share
        </button>
        <button
          onClick={onHelp}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
          style={{
            backgroundColor: '#2E3B4A',
            color: '#F0F4F8',
          }}
          title="Ask for Help"
        >
          <HelpCircle size={14} />
          Help
        </button>
      </div>
    </div>
  );
}
