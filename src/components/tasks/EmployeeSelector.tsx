import { motion } from 'framer-motion';
import { useOfficeStore } from '@/store/officeStore';

interface EmployeeSelectorProps {
  currentEmployeeId: string;
  onSelect: (employeeId: string) => void;
  onClose: () => void;
}

export function EmployeeSelector({
  currentEmployeeId,
  onSelect,
  onClose,
}: EmployeeSelectorProps) {
  const employees = useOfficeStore((s) => s.employees);
  const others = employees.filter((e) => e.id !== currentEmployeeId);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute top-full right-0 mt-1 bg-surface-2 rounded-lg shadow-lg border z-50 min-w-[200px]"
        style={{
          backgroundColor: '#2E425B',
          borderColor: '#3a4f6a',
          border: '1px solid',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {others.map((employee) => (
          <button
            key={employee.id}
            onClick={() => onSelect(employee.id)}
            className="w-full text-left px-3 py-2 hover:opacity-80 transition-opacity first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 text-sm"
            style={{ color: '#F0F4F8' }}
          >
            <span>{employee.emoji}</span>
            <span>{employee.name}</span>
          </button>
        ))}
      </motion.div>
    </>
  );
}
