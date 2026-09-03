// Cheap, dependency-free WebGL capability check — deliberately does not
// import three.js/react-three-fiber, so it can gate whether MTech HQ's 3D
// bundle is even fetched (see App.tsx) rather than only catching a failure
// after the chunk has already loaded.
export function isWebglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// MTech HQ's full 3D experience is desktop-first (see the MTech HQ brief) —
// small screens fall back to a simplified view rather than forcing the full
// interactive office into a viewport it wasn't designed for. Matches the
// app's existing --v2-* responsive breakpoint (see src/styles/main.css).
const MOBILE_BREAKPOINT_PX = 768;

export function isLikelyMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX;
}
