import { Brand } from '@/types/index';
import { BRAND_LABEL } from '@/utils/brandColors';

interface BrandBadgeProps {
  brand: Brand;
}

export function BrandBadge({ brand }: BrandBadgeProps) {
  const label = BRAND_LABEL[brand];

  return <span className={`badge-brand badge-brand-${brand}`}>{label}</span>;
}
