import { Brand } from '@/types/index';

// Single source of truth for brand colours/labels used outside CSS (chart
// fills, inline chip styles). Mirrors the --color-brand-* vars in main.css —
// keep both in sync when the brand palette changes.
export const BRAND_COLOR: Record<Brand, string> = {
  mtech: '#1D2A3A',
  brentwood: '#2E9ECC',
  'radio-links': '#4a9d4a',
  capcom: '#7b6fb0',
  ircl: '#5b6472',
  idaro: '#39FF14',
  'brentwood-marine': '#1B7A8C',
};

export const BRAND_LABEL: Record<Brand, string> = {
  mtech: 'MTech',
  brentwood: 'Brentwood',
  'radio-links': 'Radio Links',
  capcom: 'Capcom',
  ircl: 'IRCL',
  idaro: 'IDARO',
  'brentwood-marine': 'Brentwood Marine',
};

// Text colour for a solid brand-colour background — every brand is dark
// enough for white text except IDARO's neon green, which needs dark text.
export function brandBadgeTextColor(brand: Brand): string {
  return brand === 'idaro' ? '#0D1B2A' : '#fff';
}
