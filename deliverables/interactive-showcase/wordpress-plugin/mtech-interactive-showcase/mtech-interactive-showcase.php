<?php
/**
 * Plugin Name: MTech Interactive Showcase
 * Description: Interactive building-illustration showcase with clickable technology markers. Use the [interactive-showcase] shortcode on any page or post.
 * Version: 1.0.0
 * Author: MTech Group
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'MTECH_SHOWCASE_VERSION', '1.0.0' );
define( 'MTECH_SHOWCASE_DIR', plugin_dir_path( __FILE__ ) );
define( 'MTECH_SHOWCASE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Vue 3 is loaded once per page, no matter how many showcases are placed on it.
 */
function mtech_showcase_enqueue_vue() {
	wp_enqueue_script(
		'vue3',
		'https://unpkg.com/vue@3/dist/vue.global.prod.js',
		array(),
		'3',
		true
	);
}

/**
 * Default 8 technologies from the MTech Brentwood brief. Override per-site with the
 * `mtech_showcase_markers` filter, or per-shortcode-call with the `data` attribute
 * pointing at a JSON file URL (see readme.txt).
 */
function mtech_showcase_default_markers() {
	return array(
		array( 'id' => 'radio',    'title' => 'Two-Way Radios',          'description' => 'Own your communication. Stay in control.',                                                     'icon' => '📡', 'link' => 'https://www.brentwoodradios.co.uk/what-we-do/two-way-radios-for-sale/', 'x' => 9.5,  'y' => 5.5 ),
		array( 'id' => 'poc',      'title' => 'PoC Radios',               'description' => 'All-in-one device. Smart communications. Lower costs.',                                          'icon' => '📱', 'link' => 'https://www.brentwoodradios.co.uk/idaro-devices/',                       'x' => 25,   'y' => 52.2 ),
		array( 'id' => 'cctv',     'title' => 'CCTV & Access Control',    'description' => 'See clearly. Stay in control. Protect what matters.',                                            'icon' => '🎥', 'link' => 'https://www.brentwoodradios.co.uk/cctv-access-control/',                 'x' => 83.3, 'y' => 51.1 ),
		array( 'id' => 'bodycam',  'title' => 'Body Worn Cameras',        'description' => 'See everything, miss nothing.',                                                                  'icon' => '🎦', 'link' => 'https://www.brentwoodradios.co.uk/bodycams/',                            'x' => 19.2, 'y' => 76.7 ),
		array( 'id' => 'sensors',  'title' => 'Smart Sensors',            'description' => 'Smart monitoring for safer environments.',                                                        'icon' => '📶', 'link' => '/smart-sensors/',                                                         'x' => 54.2, 'y' => 47.8 ),
		array( 'id' => 'av',       'title' => 'Audio Visual',             'description' => 'Radio and audio-visual solutions for events and venues worldwide.',                                'icon' => '🔊', 'link' => 'https://www.brentwoodradios.co.uk/audio-visual/',                        'x' => 46.7, 'y' => 32.2 ),
		array( 'id' => 'ai',       'title' => 'MTech AI',                 'description' => 'Every voice becomes action. Transform your radio network into a 24/7 virtual dispatcher.',        'icon' => '🤖', 'link' => '/mtech-ai/',                                                              'x' => 73.3, 'y' => 33.3 ),
		array( 'id' => 'drones',   'title' => 'Drones',                   'description' => 'Smarter. Safer. Faster. Capture aerial data and improve site safety.',                             'icon' => '🚁', 'link' => '/drones/',                                                                'x' => 81.7, 'y' => 10 ),
		array( 'id' => 'vape',     'title' => 'Vape Detectors',           'description' => 'Detect vaping and vandalism in real time. Protect students and staff, deter misuse instantly.',    'icon' => '🚭', 'link' => 'https://www.brentwoodradios.co.uk/vape-detectors/',                      'x' => 46.7, 'y' => 78.9 ),
	);
}

/**
 * [interactive-showcase]
 * [interactive-showcase image="https://example.com/illustration.png"]
 * [interactive-showcase id="radio-links" image="..." data="https://example.com/markers.json"]
 *
 * Attributes:
 *   image - illustration URL. Defaults to the plugin's placeholder if not set.
 *   data  - optional JSON file URL to load markers from instead of the PHP defaults/filter.
 *   id    - optional slug to distinguish multiple showcases on the same page (auto-generated if omitted).
 */
function mtech_showcase_shortcode( $atts ) {
	static $instance = 0;
	$instance++;

	$atts = shortcode_atts(
		array(
			'image' => MTECH_SHOWCASE_URL . 'assets/building-illustration.svg',
			'data'  => '',
			'id'    => 'instance-' . $instance,
		),
		$atts,
		'interactive-showcase'
	);

	mtech_showcase_enqueue_vue();

	$markers = apply_filters( 'mtech_showcase_markers', mtech_showcase_default_markers() );
	$app_id  = 'mtech-showcase-app-' . sanitize_html_class( $atts['id'] );

	ob_start();
	?>
	<div id="<?php echo esc_attr( $app_id ); ?>" class="mtech-showcase">
		<div class="showcase-grid">
			<div class="illustration-panel">
				<div class="illustration-frame">
					<img
						:src="illustrationSrc"
						alt="MTech building cutaway illustration showing communication technologies"
						class="illustration-img"
					/>
					<button
						v-for="marker in markers"
						:key="marker.id"
						type="button"
						class="marker"
						:class="{ 'marker--active': activeId === marker.id }"
						:style="{ left: marker.x + '%', top: marker.y + '%' }"
						:aria-label="'View details for ' + marker.title"
						:aria-pressed="activeId === marker.id"
						@click="selectMarker(marker.id)"
					>
						<span class="marker-pulse"></span>
						<span class="marker-dot"></span>
					</button>
				</div>
			</div>

			<div class="popup-panel">
				<div class="popup-card" v-if="activeMarker" :key="activeMarker.id">
					<button type="button" class="popup-close" aria-label="Close" @click="closeMarker">✕</button>
					<div class="popup-icon">{{ activeMarker.icon }}</div>
					<h3 class="popup-title">{{ activeMarker.title }}</h3>
					<p class="popup-description">{{ activeMarker.description }}</p>
					<a :href="activeMarker.link" class="popup-cta">Learn More</a>
					<div class="popup-nav">
						<button type="button" class="popup-nav-btn" @click="cycleMarker(-1)" aria-label="Previous technology">‹</button>
						<span class="popup-nav-count">{{ activeIndex + 1 }} / {{ markers.length }}</span>
						<button type="button" class="popup-nav-btn" @click="cycleMarker(1)" aria-label="Next technology">›</button>
					</div>
				</div>
				<div class="popup-placeholder" v-else>
					<p>Select a technology marker on the illustration to learn more.</p>
				</div>
			</div>
		</div>
	</div>

	<script>
	(function () {
		function mountMtechShowcase() {
			var el = document.getElementById(<?php echo wp_json_encode( $app_id ); ?>);
			if ( ! el || typeof Vue === 'undefined' ) {
				return;
			}

			var illustrationSrc = <?php echo wp_json_encode( $atts['image'] ); ?>;
			var dataUrl = <?php echo wp_json_encode( $atts['data'] ); ?>;
			var defaultMarkers = <?php echo wp_json_encode( array_values( $markers ) ); ?>;

			function mount( markerList ) {
				var app = Vue.createApp({
					data: function () {
						return {
							illustrationSrc: illustrationSrc,
							markers: markerList,
							activeId: null,
						};
					},
					computed: {
						activeIndex: function () {
							var self = this;
							return this.markers.findIndex(function (m) { return m.id === self.activeId; });
						},
						activeMarker: function () {
							return this.activeIndex === -1 ? null : this.markers[this.activeIndex];
						},
					},
					methods: {
						selectMarker: function (id) {
							this.activeId = this.activeId === id ? null : id;
						},
						closeMarker: function () {
							this.activeId = null;
						},
						cycleMarker: function (step) {
							if (!this.markers.length) return;
							var current = this.activeIndex === -1 ? 0 : this.activeIndex;
							var next = (current + step + this.markers.length) % this.markers.length;
							this.activeId = this.markers[next].id;
						},
					},
				});
				app.mount(el);
			}

			if ( dataUrl ) {
				fetch( dataUrl )
					.then(function (r) { return r.json(); })
					.then(function (json) { mount( json ); })
					.catch(function () { mount( defaultMarkers ); });
			} else {
				mount( defaultMarkers );
			}
		}

		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', mountMtechShowcase );
		} else {
			mountMtechShowcase();
		}
	})();
	</script>
	<?php
	return ob_get_clean();
}
add_shortcode( 'interactive-showcase', 'mtech_showcase_shortcode' );

/**
 * Styles are enqueued once globally (safe with multiple shortcode instances per page).
 */
function mtech_showcase_enqueue_styles() {
	wp_enqueue_style(
		'mtech-showcase-style',
		MTECH_SHOWCASE_URL . 'assets/showcase.css',
		array(),
		MTECH_SHOWCASE_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'mtech_showcase_enqueue_styles' );
