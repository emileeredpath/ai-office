import { useOfficeStore } from '@/store/officeStore';
import { DeskCard } from './DeskCard';

export function OfficeFloor() {
  const employees = useOfficeStore((s) => s.employees);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {employees.map((employee, index) => (
        <DeskCard key={employee.id} employee={employee} index={index} />
      ))}
    </div>
  );
}
