interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const variantStyles = {
  primary: {
    bg: '#F9701F',
    bgHover: '#e05e10',
    text: '#F0F4F8',
  },
  secondary: {
    bg: '#2E425B',
    bgHover: '#3a4f6a',
    text: '#F0F4F8',
  },
  ghost: {
    bg: 'transparent',
    bgHover: '#243347',
    text: '#8F9194',
  },
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const style = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <button
      className={`rounded-lg font-medium transition-colors flex items-center gap-2 hover:opacity-80 active:scale-95 ${sizeClass} ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: variant === 'ghost' ? '1px solid transparent' : 'none',
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
