import { PERIOD_OPTIONS, usePeriod } from '@/contexts/PeriodContext';

export function PeriodSelector() {
  const { period, setPeriod } = usePeriod();

  return (
    <select
      className="v2-period-select"
      value={period}
      onChange={(e) => setPeriod(e.target.value as any)}
      aria-label="Reporting period"
    >
      {PERIOD_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
