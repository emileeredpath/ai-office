import { colors } from '@/theme/tokens';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export function Select({ label, options, error, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: colors.textMuted }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full px-3 py-2 pr-8 rounded-lg text-sm focus:outline-none transition-all appearance-none ${className}`}
          style={{
            backgroundColor: colors.surface3,
            color: colors.textPrimary,
            borderColor: error ? '#ef4444' : colors.border,
            border: '1px solid',
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: colors.textMuted }}
        />
      </div>
      {error && (
        <span className="text-xs" style={{ color: '#ef4444' }}>
          {error}
        </span>
      )}
    </div>
  );
}
