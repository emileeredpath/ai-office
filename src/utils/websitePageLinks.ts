import type { Brand } from '@/types/index';

// Confirmed MTech website domains, including mtechglobal.co.uk from the
// Website Improvement brief. Keep other brands unlinked rather than guessing.
const WEBSITE_ORIGINS: Partial<Record<Brand, string>> = {
  mtech: 'https://mtechglobal.co.uk',
  brentwood: 'https://www.brentwoodradios.co.uk',
  'radio-links': 'https://www.radio-links.co.uk',
  capcom: 'https://www.capcom.co.uk',
  ircl: 'https://ircl.ie',
};

const ALLOWED_HOSTS = new Set([
  'mtechglobal.co.uk', 'www.mtechglobal.co.uk',
  'brentwoodradios.co.uk', 'www.brentwoodradios.co.uk',
  'radio-links.co.uk', 'www.radio-links.co.uk',
  'capcom.co.uk', 'www.capcom.co.uk',
  'ircl.ie', 'www.ircl.ie',
]);

// GA4 returns a path without a host. Only attach it to the known site for
// this entity; an arbitrary GA4 value must never become an external URL.
export function getGa4PageUrl(brand: Brand, pagePath: string): string | null {
  const origin = WEBSITE_ORIGINS[brand];
  if (!origin || !pagePath.startsWith('/') || pagePath.startsWith('//') ||
    pagePath.includes('\\') || /[\u0000-\u001f?#]/.test(pagePath)) return null;
  try {
    const url = new URL(pagePath, origin);
    return url.origin === origin ? url.href : null;
  } catch {
    return null;
  }
}

// Search Console already supplies full page URLs. Validate the domain and
// omit query/fragment values when opening a page, since they can contain
// personal information and are not needed to inspect the page itself.
export function getSearchConsolePageUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol) || !ALLOWED_HOSTS.has(url.hostname) ||
      url.username || url.password || url.port) return null;
    return `https://${url.hostname}${url.pathname}`;
  } catch {
    return null;
  }
}
