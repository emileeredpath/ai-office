# Interactive Communication Systems Showcase

A self-contained Vue 3 component for the MTech Brentwood Communications website. Shows 8 technologies as clickable/tappable markers over an architectural building illustration, each opening a short description with a "Learn More" link.

## Files

- `interactive-showcase.html` — the complete component (HTML + CSS + Vue 3 JS in one file)
- `README.md` — this guide

## Quick preview

Open `interactive-showcase.html` directly in a browser. It uses a placeholder image reference (`building-illustration.png`) — see **Replacing the illustration** below to swap in the real artwork.

## Replacing the illustration

Find this line near the top of the `<script>` block:

```js
const illustrationSrc = ref('building-illustration.png');
```

Replace `'building-illustration.png'` with the final image URL (a WordPress media library URL, or any absolute path). The image should be roughly landscape/portrait-matched to how the markers below are positioned — if you use a very different aspect ratio, you'll need to re-tune marker x/y values (see next section).

## Editing technology markers

All 8 technologies live in one array in the `<script>` block:

```js
const markers = ref([
  { id: 'radio', title: 'Two-Way Radios', description: 'Own your communication. Stay in control.', icon: '📡', link: '/radio-communications/', x: 15, y: 30 },
  // ...7 more
]);
```

Each field:

| Field | Purpose |
|---|---|
| `id` | Unique key, used internally — keep it short and unique |
| `title` | Heading shown in the popup |
| `description` | 1–2 sentence copy shown in the popup |
| `icon` | Emoji or short text shown as the popup badge |
| `link` | "Learn More" destination — set to the real page URL |
| `x`, `y` | Marker position as a **percentage** of the illustration's width/height (0–100) |

**To add, remove, or reorder** technologies, add/remove/reorder objects in this array — nothing else needs to change.

**To reposition a marker**, adjust its `x`/`y` values and refresh. Because these are percentages, markers stay correctly placed if the image is resized or swapped for one with the same aspect ratio.

## WordPress installation

### Option A — Custom HTML block (fastest)
1. Copy everything from `<div id="mtech-showcase-app">` down to the closing `</script>` tag (i.e. skip the `<!doctype>`/`<html>`/`<head>`/`<body>` wrapper at the top and bottom — that part is only for standalone preview).
2. In the WordPress block editor, add a **Custom HTML** block and paste it in.
3. Update the image path and marker data as above, then publish.

### Option B — Shortcode (recommended for reuse across pages)
Add this to your theme's `functions.php` (or a small site-specific plugin):

```php
function mtech_interactive_showcase_shortcode( $atts ) {
    $atts = shortcode_atts( array( 'id' => 'default' ), $atts );
    $file = get_stylesheet_directory() . '/interactive-showcase/interactive-showcase.html';

    if ( ! file_exists( $file ) ) {
        return '';
    }

    $html = file_get_contents( $file );

    // Strip the standalone <!doctype>/<html>/<head>/<body> wrapper, keep only the widget markup.
    if ( preg_match( '/<div id="mtech-showcase-app".*<\/script>/s', $html, $matches ) ) {
        $html = $matches[0];
    }

    // Give each instance on the page a unique id so multiple showcases can coexist.
    $unique = 'mtech-showcase-app-' . esc_attr( $atts['id'] );
    $html   = str_replace( 'mtech-showcase-app', $unique, $html );

    return $html;
}
add_shortcode( 'interactive-showcase', 'mtech_interactive_showcase_shortcode' );
```

Place `interactive-showcase.html` in your active theme under `/interactive-showcase/`, then use in any page/post:

```
[interactive-showcase]
[interactive-showcase id="radio-links"]
```

(The `id` attribute lets you drop more than one showcase on the same page without their Vue instances clashing.)

### Replicating for other brands (Radio Links, Capcom, IRCL)
Duplicate `interactive-showcase.html` per brand (e.g. `interactive-showcase-radiolinks.html`), point the shortcode function at the right file per brand/site, and edit the `illustrationSrc` and `markers` array for that brand's technologies and illustration. No other code changes are needed.

## Customization reference

| Want to change... | Edit... |
|---|---|
| Brand colors | CSS custom properties at the top of `<style>`: `--mtech-navy`, `--mtech-blue`, `--mtech-orange`, etc. |
| Marker pulse speed/size | `.marker-pulse` and the `@keyframes mtech-pulse` rule |
| Popup fade/slide | `.popup-card` and `@keyframes mtech-fade-in` |
| Breakpoints | The three `@media` blocks near the end of `<style>` (1024px desktop, 768–1023px tablet, <768px mobile) |
| CTA button text | `"Learn More"` text inside the `<a class="popup-cta">` element in the HTML |

## Behavior notes

- Only one popup is shown at a time; clicking a marker while another is open swaps the content.
- Clicking the same marker twice closes the popup.
- Previous/next arrows in the popup footer let users cycle through all 8 technologies without returning to the illustration (useful on mobile).
- Desktop (≥1024px): illustration and popup sit side-by-side in a grid; the popup panel is `position: sticky` so it stays in view while the page scrolls.
- Mobile/tablet (<1024px): illustration is full width, popup appears directly below it as a single column.
- Respects `prefers-reduced-motion` — pulse and fade animations are toned down for users who request reduced motion.
- No external dependencies besides the Vue 3 CDN script tag (`unpkg.com/vue@3`) — everything else is inline.

## Answers to open questions from the brief

1. **Hard-coded vs. templated marker positions** — templated: positions are percentage-based fields in the `markers` array (not hard-coded per-pixel), so they're easy to update and stay correct if the image is resized.
2. **Inline data vs. JSON file** — kept inline in the HTML for a truly single-file, copy/paste deliverable. If you later want non-technical editing (e.g. via WordPress ACF fields) without touching code, the `markers` array can be swapped for a `fetch()` call to a JSON file or REST endpoint with no other changes to the template logic.
3. **Analytics tracking on clicks** — not implemented (kept out of scope for this pass, per the brief's focus on quality over extras). To add later: call your analytics event (e.g. `gtag('event', 'showcase_marker_click', { technology: marker.id })`) inside `selectMarker()`.
4. **Keyboard navigation** — markers are real `<button>` elements, so they're natively focusable and clickable via <kbd>Tab</kbd>/<kbd>Enter</kbd>/<kbd>Space</kbd>. Left/right cycling through technologies is available via the popup's `‹`/`›` buttons (also keyboard-accessible). Arrow-key cycling while focused on the illustration wasn't added, to keep this pass focused — straightforward to add to `cycleMarker()` with a `keydown` listener if wanted.

## Testing checklist

- [x] All 8 markers clickable and functional
- [x] Popup opens/closes smoothly (fade transition)
- [x] Buttons link to placeholder pages — **update `link` values to real URLs before launch**
- [x] Animations use CSS only (pulse, fade) — no JS-driven animation loops
- [x] Responsive layout at 375px / 768px / 1024px breakpoints
- [x] Touch (tap) works identically to click — markers are standard buttons
- [x] Only one popup visible at a time
- [x] Close button (✕) works
- [x] Markers remain visible/clickable at all breakpoints
- [ ] Final architectural illustration swapped in (placeholder image reference currently in place)
- [ ] Real "Learn More" destination URLs confirmed for all 8 technologies
