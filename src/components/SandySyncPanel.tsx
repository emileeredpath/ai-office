import { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { useOfficeStore } from '@/store/officeStore';
import type { TaskStatus } from '@/types/employee';

interface SandyUpdate {
  employeeName: string;
  currentTask?: string;
  taskQueue: string[];
  priority: string;
  taskStatus: TaskStatus;
}

function parseTaskStatus(value: string): TaskStatus {
  if (value.includes('progress') || value.includes('working')) return 'in_progress';
  if (value.includes('john')) return 'waiting_john_approval';
  if (value.includes('customer')) return 'waiting_customer';
  if (value.includes('review')) return 'waiting_review';
  if (value.includes('blocked')) return 'blocked';
  if (value.includes('complete') || value.includes('done')) return 'complete';
  if (value.includes('brief')) return 'awaiting_brief';
  return 'assigned';
}

export function SandySyncPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const employees = useOfficeStore((state) => state.employees);
  const assignTask = useOfficeStore((state) => state.assignTask);

  const parseSandyUpdate = (text: string): SandyUpdate[] => {
    // Expected format per block:
    // Employee: Name
    // Status: in progress / waiting for john / waiting for customer / blocked / complete
    // Task: title
    // Todo: item1, item2
    // Priority: high/medium/low

    const updates: SandyUpdate[] = [];
    const sections = text.split(/Employee:|---/g).filter((s) => s.trim());

    sections.forEach((section) => {
      const lines = section.split('\n').filter((l) => l.trim());
      if (lines.length === 0) return;

      const update: SandyUpdate = {
        employeeName: '',
        taskQueue: [],
        priority: 'medium',
        taskStatus: 'assigned',
      };

      lines.forEach((line, idx) => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim().toLowerCase();

        if (idx === 0 && !line.includes(':')) {
          update.employeeName = line.trim();
        }
        if (key.includes('Name')) {
          const name = line.replace('Name:', '').trim();
          if (name) update.employeeName = name;
        }
        if (key.includes('Status')) {
          update.taskStatus = parseTaskStatus(value);
        }
        if (key.includes('Task') && !key.includes('Todo')) {
          const task = line.replace(/Task:?/i, '').trim();
          if (task) update.currentTask = task;
        }
        if (key.includes('Todo') || key.includes('Queue')) {
          const items = value.split(',').map((s) => s.trim());
          update.taskQueue = items.filter((s) => s.length > 0);
        }
        if (key.includes('Priority')) {
          if (value.includes('high')) update.priority = 'high';
          else if (value.includes('low')) update.priority = 'low';
          else update.priority = 'medium';
        }
      });

      if (!update.employeeName && lines[0]) {
        update.employeeName = lines[0].trim();
      }

      if (update.employeeName) {
        updates.push(update);
      }
    });

    return updates;
  };

  const handleSync = () => {
    try {
      setSyncStatus('idle');

      if (!pastedContent.trim()) {
        setStatusMessage('Please paste Sandy update content');
        setSyncStatus('error');
        return;
      }

      const updates = parseSandyUpdate(pastedContent);

      if (updates.length === 0) {
        setStatusMessage('Could not parse any employee updates');
        setSyncStatus('error');
        return;
      }

      let successCount = 0;
      updates.forEach((update) => {
        const employee = employees.find(
          (e) => e.name.toLowerCase() === update.employeeName.toLowerCase()
        );

        if (!employee) return;

        if (update.currentTask) {
          assignTask(employee.id, {
            id: `task-sandy-${Date.now()}-${employee.id}`,
            title: update.currentTask,
            priority: (update.priority as 'low' | 'medium' | 'high') || 'medium',
            createdAt: new Date().toISOString(),
            status: update.taskStatus,
            assignedBy: 'sandy',
          });
        }

        update.taskQueue.forEach((taskTitle, idx) => {
          assignTask(employee.id, {
            id: `task-queue-${Date.now()}-${employee.id}-${idx}`,
            title: taskTitle,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            status: 'assigned',
            assignedBy: 'sandy',
          });
        });

        successCount++;
      });

      if (successCount === 0) {
        setSyncStatus('error');
        setStatusMessage('No matching employee names found');
        return;
      }

      setSyncStatus('success');
      setStatusMessage(`✅ Synced ${successCount} employee${successCount !== 1 ? 's' : ''} from Sandy`);
      setPastedContent('');

      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      setSyncStatus('error');
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-30 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        style={{
          backgroundColor: '#2E3B4A',
          color: '#F0F4F8',
          border: '1px solid #3a4f6a',
        }}
        title="Sync updates from Sandy"
      >
        <Upload size={18} />
        <span className="text-sm font-medium">Sync from Sandy</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-6 z-40 w-96 rounded-lg shadow-2xl p-6 border"
      style={{
        backgroundColor: '#1D2A3A',
        borderColor: '#3a4f6a',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#F0F4F8]">Sync from Sandy</h3>
          <p className="text-xs text-[#8F9194]">Paste task updates from Claude</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#2E3B4A] rounded">
          <X size={18} className="text-[#8F9194]" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={pastedContent}
        onChange={(e) => setPastedContent(e.target.value)}
        placeholder="Paste Sandy's task assignment here...

Example format:
Employee: Sarah
Status: assigned
Task: Update website prices
Todo: Research competitor pricing, Update database
Priority: high

Employee: Tisha
Status: in progress
Task: Announce product update"
        className="w-full h-40 p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F9701F] mb-4"
        style={{
          backgroundColor: '#111B26',
          color: '#F0F4F8',
          borderColor: '#3a4f6a',
          border: '1px solid #3a4f6a',
        }}
      />

      {/* Status Message */}
      {syncStatus !== 'idle' && (
        <div
          className="mb-4 p-3 rounded text-sm flex items-center gap-2"
          style={{
            backgroundColor: syncStatus === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 107, 107, 0.2)',
            color: syncStatus === 'success' ? '#4CAF50' : '#FF6B6B',
          }}
        >
          {syncStatus === 'success' ? <Check size={16} /> : <X size={16} />}
          {statusMessage}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSync}
          className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#F9701F', color: '#FFFFFF' }}
        >
          <Upload size={16} />
          Sync Tasks
        </button>
        <button
          onClick={() => {
            setPastedContent('');
            setIsOpen(false);
          }}
          className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
          style={{ backgroundColor: '#2E3B4A', color: '#F0F4F8' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
