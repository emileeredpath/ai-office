import { colors } from '@/theme/tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: colors.textMuted }}>
          {label}
        </label>
      )}
      <input
        className={`px-3 py-2 rounded-lg text-sm focus:outline-none transition-all ${className}`}
        style={{
          backgroundColor: colors.surface3,
          color: colors.textPrimary,
          borderColor: error ? '#ef4444' : colors.border,
          border: '1px solid',
        }}
        {...props}
      />
      {error && (
        <span className="text-xs" style={{ color: '#ef4444' }}>
          {error}
        </span>
      )}
    </div>
  );
}
