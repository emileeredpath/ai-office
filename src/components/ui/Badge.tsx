interface BadgeProps {
  label: string;
  color?: string;
  small?: boolean;
}

export function Badge({ label, color = '#8F9194', small = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}
