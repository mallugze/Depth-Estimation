// Centralized API configuration for local dev and cloud deployment (Vercel / Render / Railway)

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : ''
);

/**
 * Returns full URL for static assets/images returned by the backend.
 * Handles relative paths, absolute URLs, and base64 strings gracefully.
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Demo sample result payload for when backend is not yet connected or for instant portfolio showcase.
 */
export const SAMPLE_DEMO_RESULT = {
  id: 1,
  filename: "sample_bridge_deck_fissure.jpg",
  prediction: "crack",
  confidence: 0.984,
  severity: "HIGH",
  severity_score: 78.5,
  crack_area_pct: 14.8,
  crack_length_px: 432.0,
  max_depth_drop: 38.6,
  depth_std: 172.4,
  image_path: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  depth_map_path: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  contour_path: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  structure_type: "Bridge Deck",
  created_at: new Date().toISOString(),
  profile_data: Array.from({ length: 100 }, (_, i) => {
    const baseline = 120 + Math.sin(i * 0.1) * 15;
    const crackDip = (i > 42 && i < 58) ? - (1 - Math.abs(i - 50) / 8) * 45 : 0;
    return {
      index: i,
      x: i * 8,
      y: 200,
      depth: parseFloat((baseline + crackDip + (Math.random() * 4 - 2)).toFixed(2))
    };
  }),
  point_cloud_3d: Array.from({ length: 1600 }, (_, idx) => {
    const row = Math.floor(idx / 40);
    const col = idx % 40;
    const x = ((col / 40) - 0.5) * 10;
    const y = -(((row / 40) - 0.5) * 10);
    const distToCenter = Math.sqrt(x*x + y*y);
    const isCrack = (Math.abs(y - 0.4 * x) < 0.6) && (x > -3 && x < 3);
    const z = isCrack ? 0.3 : Math.max(0, 2.5 - distToCenter * 0.3 + Math.sin(x) * 0.4);
    const r = isCrack ? 240 : Math.floor(120 + x * 10);
    const g = isCrack ? 80 : Math.floor(140 + y * 10);
    const b = isCrack ? 80 : Math.floor(160 + z * 15);
    return [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2)), r, g, b];
  }),
  image_dims: { width: 800, height: 600 }
};
