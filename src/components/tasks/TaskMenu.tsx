import { useState } from 'react';
import { MoreVertical, Trash2, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmployeeSelector } from './EmployeeSelector';

interface TaskMenuProps {
  bucket: 'current' | 'queue' | 'completed';
  employeeId: string;
  onMakeCurrent?: () => void;
  onMarkComplete?: () => void;
  onBackToQueue?: () => void;
  onReassign?: (toEmployeeId: string) => void;
  onDelete: () => void;
  onRestore?: () => void;
}

export function TaskMenu({
  bucket,
  employeeId,
  onMakeCurrent,
  onMarkComplete,
  onBackToQueue,
  onReassign,
  onDelete,
  onRestore,
}: TaskMenuProps) {
  const [showAssignee, setShowAssignee] = useState(false);

  return (
    <>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {bucket === 'current' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={<CheckCircle size={14} />}
              onClick={() => {
                onMarkComplete?.();
              }}
              title="Mark complete"
            />
            {onBackToQueue && (
              <Button
                size="sm"
                variant="ghost"
                icon={<RotateCcw size={14} />}
                onClick={() => {
                  onBackToQueue();
                }}
                title="Back to queue"
              />
            )}
          </>
        )}

        {bucket === 'queue' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowRight size={14} />}
              onClick={() => {
                onMakeCurrent?.();
              }}
              title="Make current"
            />
            {onReassign && (
              <Button
                size="sm"
                variant="ghost"
                icon={<MoreVertical size={14} />}
                onClick={() => setShowAssignee(true)}
                title="Reassign"
              />
            )}
          </>
        )}

        {bucket === 'completed' && onRestore && (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              onRestore();
            }}
            title="Restore to queue"
          />
        )}

        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 size={14} />}
          onClick={() => {
            onDelete();
          }}
          title="Delete"
        />
      </div>

      {showAssignee && onReassign && (
        <EmployeeSelector
          currentEmployeeId={employeeId}
          onSelect={(toId) => {
            onReassign(toId);
            setShowAssignee(false);
          }}
          onClose={() => setShowAssignee(false)}
        />
      )}
    </>
  );
}
