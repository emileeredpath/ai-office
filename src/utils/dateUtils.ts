export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} ${getMonthName(d.getMonth())} ${year}`;
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${getMonthName(d.getMonth()).substring(0, 3)}`;
}

export function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month];
}

export function getDaysInMonth(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}
