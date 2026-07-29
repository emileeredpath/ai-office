import { Brand } from '@/types/index';

// Single source of truth for brand colours/labels used outside CSS (chart
// fills, inline chip styles). Mirrors the --color-brand-* vars in main.css —
// keep both in sync when the brand palette changes.
export const BRAND_COLOR: Record<Brand, string> = {
  mtech: '#1D2A3A',
  brentwood: '#3A82C6',
  'radio-links': '#23772D',
  capcom: '#524495',
  ircl: '#251F4B',
  idaro: '#DB2777',
};

export const BRAND_LABEL: Record<Brand, string> = {
  mtech: 'MTech',
  brentwood: 'Brentwood',
  'radio-links': 'Radio Links',
  capcom: 'Capcom',
  ircl: 'IRCL',
  idaro: 'IDARO',
};
