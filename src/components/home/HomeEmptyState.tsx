import type { ReactNode } from 'react';

export function HomeEmptyState({ children }: { children: ReactNode }) {
  return <div className="home-empty-state">{children}</div>;
}
