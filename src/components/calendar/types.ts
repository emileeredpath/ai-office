import type { MarketingEvent } from '@/utils/marketingEvents';

// A MarketingEvent with its click destination already resolved (see
// CalendarScreen's getEventClickHandler) — the three views just render
// items, they don't decide navigation.
export interface CalendarActivityItem extends MarketingEvent {
  onClick?: () => void;
}
