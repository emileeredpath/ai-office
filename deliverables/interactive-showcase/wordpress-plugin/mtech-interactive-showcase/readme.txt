=== MTech Interactive Showcase ===
Contributors: mtechgroup
Tags: shortcode, interactive, vue
Requires at least: 5.0
Tested up to: 6.6
Stable tag: 1.0.0
License: GPLv2 or later

Interactive building-illustration showcase with clickable technology markers, for any MTech Group brand site.

== Description ==

Adds an `[interactive-showcase]` shortcode that renders 8 clickable/tappable
markers over a building illustration. Clicking a marker opens a popup with an
icon, title, short description and a "Learn More" link. Fully responsive
(desktop side-by-side layout, mobile/tablet stacked layout).

== Installation ==

1. Upload the `mtech-interactive-showcase` folder to `/wp-content/plugins/`.
2. Activate the plugin through the "Plugins" menu in WordPress.
3. Add `[interactive-showcase]` to any page or post.

== Usage ==

Basic:

    [interactive-showcase]

With a custom illustration:

    [interactive-showcase image="https://example.com/wp-content/uploads/building.png"]

Multiple showcases on one page (give each a unique `id`):

    [interactive-showcase id="main"]
    [interactive-showcase id="secondary" image="https://example.com/other-building.png"]

Loading marker data from a JSON file instead of the built-in defaults:

    [interactive-showcase data="https://example.com/wp-content/uploads/markers.json"]

The JSON file should be an array of objects shaped like:

    [
      { "id": "radio", "title": "Two-Way Radios", "description": "...", "icon": "📡", "link": "/radio-communications/", "x": 15, "y": 30 }
    ]

== Customizing the default technologies ==

Without a `data` attribute, the shortcode uses the 8 MTech Brentwood
technologies defined in `mtech_showcase_default_markers()` inside
`mtech-interactive-showcase.php`. To change them site-wide without editing
that function directly, hook the `mtech_showcase_markers` filter from your
theme's `functions.php`:

    add_filter( 'mtech_showcase_markers', function( $markers ) {
        // Return your own array here, or modify $markers.
        return $markers;
    } );

== Replicating for other brands ==

Duplicate this plugin folder (rename it, e.g. `radio-links-interactive-showcase`),
update the text in `mtech_showcase_default_markers()` and the placeholder SVG,
and activate it on that brand's site. Each site's plugin instance is fully
independent.

== Changelog ==

= 1.0.0 =
* Initial release.
