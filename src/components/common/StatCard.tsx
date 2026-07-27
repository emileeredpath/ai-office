interface StatCardProps {
  title: string;
  value: number;
  accent?: string;
}

export function StatCard({ title, value, accent = '#3B82F6' }: StatCardProps) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="text-text-secondary text-sm font-medium mb-3">{title}</div>
      <div className="text-5xl font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}
