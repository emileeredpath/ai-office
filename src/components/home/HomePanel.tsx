import type { ReactNode } from 'react';

type HomePanelVariant = 'default' | 'accent' | 'commercial' | 'attention' | 'muted';

interface HomePanelProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: HomePanelVariant;
  className?: string;
}

export function HomePanel({ title, eyebrow, action, children, variant = 'default', className = '' }: HomePanelProps) {
  return (
    <div className={`home-panel home-panel-${variant} ${className}`.trim()}>
      {(title || eyebrow || action) && (
        <div className="home-panel-heading">
          <div>
            {eyebrow && <div className="home-eyebrow">{eyebrow}</div>}
            {title && <h3>{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
