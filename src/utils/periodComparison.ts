import type { Period } from '@/contexts/PeriodContext';

// Shared previous-period comparison logic — built once here so any screen
// wiring up a "vs last period" figure uses the same bounded date-range
// math and the same honest-unavailable rules. See REPORTING_PERIOD.md for
// why "all time" has no meaningful previous period, and why this can't
// just reuse periodStartDate()/filterCampaignsByPeriod() unmodified (both
// are open-ended — "from X to now" — with no upper bound, whereas a
// previous period needs a genuine [start, end) window).

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// The current period's own [start, end] window, for symmetry with
// getPreviousPeriodRange below — endDate is always "today" for the
// current period, matching every existing resolve*DateRange() util.
export function getCurrentPeriodRange(period: Period, now: Date = new Date()): DateRange | null {
  if (period === 'all-time') return null;
  const start =
    period === 'this-month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === 'this-quarter'
        ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        : new Date(now.getFullYear(), 0, 1);
  return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
}

// The immediately-preceding period of equal calendar length — e.g. "This
// month" (1st–today) compares against the full previous calendar month
// (1st–last day), "This quarter" against the full previous quarter, "This
// year" against the full previous year. Returns null for "All time" —
// there is no honest "previous all time" to compare against, so callers
// must show an explicit unavailable state rather than inventing one.
export function getPreviousPeriodRange(period: Period, now: Date = new Date()): DateRange | null {
  if (period === 'all-time') return null;

  if (period === 'this-month') {
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of previous month
    const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1);
    return { startDate: toIsoDate(prevMonthStart), endDate: toIsoDate(prevMonthEnd) };
  }

  if (period === 'this-quarter') {
    const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const prevQuarterEnd = new Date(now.getFullYear(), currentQuarterStartMonth, 0); // day before this quarter started
    const prevQuarterStartMonth = Math.floor(prevQuarterEnd.getMonth() / 3) * 3;
    const prevQuarterStart = new Date(prevQuarterEnd.getFullYear(), prevQuarterStartMonth, 1);
    return { startDate: toIsoDate(prevQuarterStart), endDate: toIsoDate(prevQuarterEnd) };
  }

  // this-year
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  return { startDate: toIsoDate(prevYearStart), endDate: toIsoDate(prevYearEnd) };
}

export interface PeriodComparison {
  current: number;
  previous: number | null; // null = genuinely unavailable, never a fabricated 0
  absoluteChange: number | null;
  percentChange: number | null; // null when previous is unavailable OR previous is 0 (a % change against zero is not meaningful, not "infinite growth")
}

// current === null means there's nothing to show at all (caller should
// render its own not-connected/no-data state, same as today). previous
// === null means the current value IS real but no genuine previous-period
// figure could be obtained (e.g. that source wasn't configured/synced far
// enough back) — these are deliberately different states, never collapsed
// into one "—".
export function compareToPrevious(current: number | null, previous: number | null): PeriodComparison | null {
  if (current == null) return null;
  if (previous == null) return { current, previous: null, absoluteChange: null, percentChange: null };
  const absoluteChange = current - previous;
  const percentChange = previous !== 0 ? Math.round((absoluteChange / previous) * 1000) / 10 : null;
  return { current, previous, absoluteChange, percentChange };
}
