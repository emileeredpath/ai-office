interface StatCardProps {
  title: string;
  value: number;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="card">
      <div className="text-text-secondary text-sm font-medium mb-2">{title}</div>
      <div className="text-4xl font-bold text-text-primary">{value}</div>
    </div>
  );
}
