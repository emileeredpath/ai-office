import { Brand } from '@/types/index';

interface BrandBadgeProps {
  brand: Brand;
}

const BRAND_LABELS: Record<Brand, string> = {
  'mtech': 'MTech',
  'brentwood': 'Brentwood',
  'radio-links': 'Radio Links',
  'capcom': 'Capcom',
  'ircl': 'IRCL',
};

export function BrandBadge({ brand }: BrandBadgeProps) {
  const label = BRAND_LABELS[brand];

  return <span className={`badge-brand badge-brand-${brand}`}>{label}</span>;
}
