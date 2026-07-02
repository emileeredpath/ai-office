import type { Employee } from '@/types/employee';

interface EmployeeAvatarProps {
  employee: Employee;
  size?: 'small' | 'medium' | 'large';
}

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  'marketing-director': { bg: '#D84C45', text: '#fff' },
  'website-auditor': { bg: '#2BA876', text: '#fff' },
  'seo-ppc-manager': { bg: '#1E5A9F', text: '#fff' },
  'email-marketing-manager': { bg: '#00A0C6', text: '#fff' },
  'proposal-writer': { bg: '#5C4ADE', text: '#fff' },
  'social-media-manager': { bg: '#D84B8A', text: '#fff' },
  'case-study-writer': { bg: '#9C6ADE', text: '#fff' },
  'funding-rewards-manager': { bg: '#2BA876', text: '#fff' },
};

export function EmployeeAvatar({ employee, size = 'medium' }: EmployeeAvatarProps) {
  const colors = AVATAR_COLORS[employee.id] || { bg: '#999', text: '#fff' };

  const sizeMap = {
    small: { width: '28px', height: '28px', fontSize: '11px' },
    medium: { width: '40px', height: '40px', fontSize: '14px' },
    large: { width: '56px', height: '56px', fontSize: '18px' },
  };

  const dimensions = sizeMap[size];

  // Get initials from employee name
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '8px',
        backgroundColor: colors.bg,
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dimensions.fontSize,
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}
      title={employee.name}
    >
      {initials}
    </div>
  );
}
