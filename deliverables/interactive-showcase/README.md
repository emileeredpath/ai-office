# Interactive Communication Systems Showcase

A self-contained Vue 3 component for the MTech Brentwood Communications website. Shows 9 technologies as clickable/tappable markers over an original architectural building-cutaway illustration, each opening a short description with a "Learn More" link.

## Files

- `interactive-showcase.html` — the complete component (HTML + CSS + Vue 3 JS in one file)
- `assets/building-illustration.svg` / `.png` — the original building-cutaway artwork (see **The illustration** below)
- `wordpress-plugin/mtech-interactive-showcase/` — drop-in WordPress plugin version (see below)
- `README.md` — this guide

## Quick preview

Open `interactive-showcase.html` directly in a browser (or a local server, since it loads `assets/building-illustration.svg` by relative path).

## The illustration

`assets/building-illustration.svg` is an original hand-drawn-style room illustration — a two-wall cutaway (like a dollhouse with the front wall removed) showing a meeting room, reception desk, shelving, server/AV rack, window, door and ceiling, in soft grey pencil-sketch line art with labelled callout arrows in MTech blue, echoing the reference "opened-room" style used elsewhere in MTech's marketing. Each of the 9 technologies has its own device drawn into the scene (rooftop-style wall mast for Two-Way Radios, a wall-mounted PoC unit, CCTV domes, a body-worn-camera dock, ceiling smart sensors, a server rack for Audio Visual, a wall screen for MTech AI, a hovering drone, and a ceiling vape sensor). It's vector (SVG), so it stays crisp at any size; a rasterised `building-illustration.png` (3200×2200) is included too, in case your CMS media library doesn't accept SVG uploads.

The interactive marker layer sits **on top of** these baked-in badges as a transparent hit-target — it never paints a solid dot over the icon, only a hover/active ring and a pulse cue, so the hand-drawn icon stays visible underneath at all times. If you replace the illustration with different artwork, keep this in mind: either bake your own icon badges into the image, or fall back to the marker's `icon` emoji as the sole visual (remove the `.marker-dot`/`.marker-pulse` "ring-only" styling and give it a background fill again).

**To swap the illustration:** find this line near the top of the `<script>` block:

```js
const illustrationSrc = ref('assets/building-illustration.svg');
```

Point it at your own image (WordPress media library URL or any path). If the new artwork doesn't already have icon badges lined up with the `markers` array's `x`/`y` values, re-tune those coordinates to match — see next section.

## Editing technology markers

All 9 technologies live in one array in the `<script>` block:

```js
const markers = ref([
  { id: 'radio', title: 'Two-Way Radios', description: 'Own your communication. Stay in control.', icon: '📡', link: 'https://www.brentwoodradios.co.uk/what-we-do/two-way-radios-for-sale/', x: 9.5, y: 5.5 },
  // ...8 more
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

### Option A — Plugin (recommended)

Use the ready-made plugin in `wordpress-plugin/mtech-interactive-showcase/`:

1. Zip the `mtech-interactive-showcase` folder (or upload it as-is via SFTP) to `/wp-content/plugins/`.
2. Activate it under **Plugins** in wp-admin.
3. Add `[interactive-showcase]` to any page or post. Multiple instances on one page are supported — give each a unique `id` attribute, e.g. `[interactive-showcase id="radio-links"]`.
4. Pass a real illustration with `[interactive-showcase image="https://yoursite.com/wp-content/uploads/building.png"]`.

See `wordpress-plugin/mtech-interactive-showcase/readme.txt` for full shortcode options (custom marker data via JSON, filtering the default technology list, replicating for other brands).

### Option B — Custom HTML block (fastest, no plugin install)
1. Copy everything from `<div id="mtech-showcase-app">` down to the closing `</script>` tag (i.e. skip the `<!doctype>`/`<html>`/`<head>`/`<body>` wrapper at the top and bottom — that part is only for standalone preview).
2. In the WordPress block editor, add a **Custom HTML** block and paste it in.
3. Update the image path and marker data as above, then publish.

### Option C — Roll-your-own shortcode from the standalone file
If you'd rather not use the packaged plugin (e.g. you want the shortcode defined in your own theme), add this to your theme's `functions.php` (or a small site-specific plugin):

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
- Previous/next arrows in the popup footer let users cycle through all 9 technologies without returning to the illustration (useful on mobile).
- Desktop (≥1024px): illustration and popup sit side-by-side in a grid; the popup panel is `position: sticky` so it stays in view while the page scrolls.
- Mobile/tablet (<1024px): illustration is full width, popup appears directly below it as a single column.
- Respects `prefers-reduced-motion` — pulse and fade animations are toned down for users who request reduced motion.
- No external dependencies besides the Vue 3 CDN script tag (`unpkg.com/vue@3`) — everything else is inline.

## Answers to open questions from the brief

1. **Hard-coded vs. templated marker positions** — templated: positions are percentage-based fields in the `markers` array (not hard-coded per-pixel), so they're easy to update and stay correct if the image is resized.
2. **Inline data vs. JSON file** — kept inline in the HTML for a truly single-file, copy/paste deliverable. If you later want non-technical editing (e.g. via WordPress ACF fields) without touching code, the `markers` array can be swapped for a `fetch()` call to a JSON file or REST endpoint with no other changes to the template logic.
3. **Analytics tracking on clicks** — not implemented (kept out of scope for this pass, per the brief's focus on quality over extras). To add later: call your analytics event (e.g. `gtag('event', 'showcase_marker_click', { technology: marker.id })`) inside `selectMarker()`.
4. **Keyboard navigation** — markers are real `<button>` elements, so they're natively focusable and clickable via <kbd>Tab</kbd>/<kbd>Enter</kbd>/<kbd>Space</kbd>. Left/right cycling through technologies is available via the popup's `‹`/`›` buttons (also keyboard-accessible). Arrow-key cycling while focused on the illustration wasn't added, to keep this pass focused — straightforward to add to `cycleMarker()` with a `keydown` listener if wanted.

## Confirmed vs. placeholder links

Of the 9 technologies, these link to real, confirmed pages:

| Technology | URL |
|---|---|
| Two-Way Radios | https://www.brentwoodradios.co.uk/what-we-do/two-way-radios-for-sale/ |
| PoC Radios | https://www.brentwoodradios.co.uk/idaro-devices/ (IDARO is MTech's PoC radio product line) |
| CCTV & Access Control | https://www.brentwoodradios.co.uk/cctv-access-control/ |
| Body Worn Cameras | https://www.brentwoodradios.co.uk/bodycams/ |
| Audio Visual | https://www.brentwoodradios.co.uk/audio-visual/ |
| Vape Detectors *(bonus 9th technology, not in the original brief)* | https://www.brentwoodradios.co.uk/vape-detectors/ |

Still placeholder (`/smart-sensors/`, `/mtech-ai/`, `/drones/`) — swap in the real URLs in both `interactive-showcase.html` and `wordpress-plugin/mtech-interactive-showcase/mtech-interactive-showcase.php` (`mtech_showcase_default_markers()`) before launch:

- Smart Sensors
- MTech AI
- Drones

## Testing checklist

- [x] All 9 markers clickable and functional
- [x] Popup opens/closes smoothly (fade transition)
- [x] 6 of 9 buttons link to real, confirmed pages — see table above for the 3 still on placeholder links
- [x] Animations use CSS only (pulse, fade) — no JS-driven animation loops
- [x] Responsive layout at 375px / 768px / 1024px breakpoints
- [x] Touch (tap) works identically to click — markers are standard buttons
- [x] Only one popup visible at a time
- [x] Close button (✕) works
- [x] Markers remain visible/clickable at all breakpoints
- [x] Original building-cutaway illustration in place, with icon badges aligned to marker positions
- [ ] Real "Learn More" destination URLs confirmed for Smart Sensors, MTech AI and Drones
