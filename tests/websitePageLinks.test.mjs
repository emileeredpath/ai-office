import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/websitePageLinks.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getGa4PageUrl, getSearchConsolePageUrl } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

test('GA4 paths link to the confirmed entity website without changing metrics', () => {
  assert.equal(getGa4PageUrl('brentwood', '/contact-us/'), 'https://www.brentwoodradios.co.uk/contact-us/');
  assert.equal(getGa4PageUrl('capcom', '/products/radios'), 'https://www.capcom.co.uk/products/radios');
  assert.equal(getGa4PageUrl('ircl', '/services/'), 'https://ircl.ie/services/');
  assert.equal(getGa4PageUrl('idaro', '/'), null);
});

test('untrusted or unavailable GA4 paths never become links', () => {
  for (const path of ['(not set)', 'https://evil.example/x', '//evil.example/x', '/\\evil.example', '/contact?email=x@y.com', '/contact#secret']) {
    assert.equal(getGa4PageUrl('brentwood', path), null);
  }
});

test('Search Console links require a confirmed host and omit query strings', () => {
  assert.equal(getSearchConsolePageUrl('http://www.radio-links.co.uk/contact?utm_source=google'), 'https://www.radio-links.co.uk/contact');
  assert.equal(getSearchConsolePageUrl('https://www.brentwoodradios.co.uk/?email=person%40example.com'), 'https://www.brentwoodradios.co.uk/');
  assert.equal(getSearchConsolePageUrl('https://evil.example/contact'), null);
  assert.equal(getSearchConsolePageUrl('javascript:alert(1)'), null);
  assert.equal(getSearchConsolePageUrl('https://www.capcom.co.uk.evil.example/'), null);
});
