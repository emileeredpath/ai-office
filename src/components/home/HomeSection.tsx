import type { ReactNode } from 'react';

interface HomeSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HomeSection({ eyebrow, title, description, action, children, className = '' }: HomeSectionProps) {
  return (
    <section className={`home-section ${className}`.trim()}>
      <div className="home-section-heading">
        <div>
          {eyebrow && <div className="home-eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="home-section-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}
