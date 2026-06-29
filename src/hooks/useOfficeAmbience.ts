import { useOfficeStore } from '@/store/officeStore';

const greetings = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
};

export function useOfficeAmbience() {
  const officeTime = useOfficeStore((s) => s.officeTime);
  const employees = useOfficeStore((s) => s.employees);

  const activeCount = employees.filter(
    (e) => e.status === 'busy' || e.status === 'in-review'
  ).length;

  return {
    officeTime,
    greeting: greetings[officeTime],
    activeCount,
    totalEmployees: employees.length,
  };
}
