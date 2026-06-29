import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useOfficeStore } from '@/store/officeStore';
import type { Task } from '@/types/employee';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export function TaskForm({ isOpen, onClose, employeeId }: TaskFormProps) {
  const employees = useOfficeStore((s) => s.employees);
  const addTask = useOfficeStore((s) => s.addTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignTo, setAssignTo] = useState(employeeId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as 'low' | 'medium' | 'high',
      createdAt: new Date().toISOString(),
    };

    addTask(assignTo, task);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssignTo(employeeId);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <div className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g., Write campaign brief"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#8F9194' }}>
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-all resize-none"
            style={{
              backgroundColor: '#243347',
              color: '#F0F4F8',
              borderColor: '#3a4f6a',
              border: '1px solid',
            }}
            placeholder="Optional task details"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <Select
          label="Assign to"
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          options={employees.map((e) => ({
            value: e.id,
            label: `${e.emoji} ${e.name}`,
          }))}
        />
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}
