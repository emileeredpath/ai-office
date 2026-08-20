import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Global reporting-period selector — Phase 1A. This is a real, working date
// filter (used client-side against real deadline/date fields already in the
// store) but it is not a promise that every screen's data is period-aware
// yet; only the Overview consumes it in Phase 1A.
export type Period = 'this-month' | 'this-quarter' | 'this-year' | 'all-time';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'this-year', label: 'This year' },
  { value: 'all-time', label: 'All time' },
];

export function periodStartDate(period: Period, now: Date = new Date()): Date | null {
  if (period === 'all-time') return null;
  if (period === 'this-month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'this-quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), quarterStartMonth, 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

interface PeriodContextType {
  period: Period;
  setPeriod: (period: Period) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

const STORAGE_KEY = 'mtech-selected-period';

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PERIOD_OPTIONS.some((o) => o.value === saved)) return saved as Period;
    return 'this-month';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, period);
  }, [period]);

  return <PeriodContext.Provider value={{ period, setPeriod }}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within PeriodProvider');
  }
  return context;
}
