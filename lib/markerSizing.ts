// Print-specific marker sizing based on nearest-neighbor distance
// Computes safe circle diameter per marker so labels don't overlap

export interface MarkerPoint {
  id: string;
  pixel_x: number;
  pixel_y: number;
}

export interface MarkerSize {
  id: string;
  diameter: number;
  fontSize: number;
}

// Sizing constants (PDF scale=1 space, in pixels)
const MIN_DIAMETER = 10; // floor: never shrink below this for legibility at A3
const MAX_DIAMETER = 40; // ceiling: don't balloon isolated markers
const DIAMETER_FRACTION = 0.6; // circle uses at most 60% of nearest-neighbor gap
const FONT_FRACTION = 0.45; // Reduced from 0.55 for consistency

/**
 * Compute per-marker circle size based on distance to nearest neighbor.
 * Sparse markers get larger circles; dense clusters get smaller ones.
 * All sizes are in PDF-space (scale=1), independent of print/zoom scale.
 */
export function computeMarkerSizes(markers: MarkerPoint[]): MarkerSize[] {
  if (markers.length === 0) return [];
  if (markers.length === 1) {
    return [
      {
        id: markers[0].id,
        diameter: MAX_DIAMETER,
        fontSize: MAX_DIAMETER * FONT_FRACTION,
      },
    ];
  }

  return markers.map((marker) => {
    let nearestDist = Infinity;

    // Find nearest other marker by Euclidean distance
    for (const other of markers) {
      if (other.id === marker.id) continue;
      const dx = marker.pixel_x - other.pixel_x;
      const dy = marker.pixel_y - other.pixel_y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
      }
    }

    // Clamp diameter: use fraction of gap, but stay within bounds
    const raw = nearestDist * DIAMETER_FRACTION;
    const diameter = Math.max(MIN_DIAMETER, Math.min(MAX_DIAMETER, raw));
    const width = diameter * 1.15;
    const height = diameter * 0.85;
    const fontSize = diameter * FONT_FRACTION;

    return { id: marker.id, diameter, width, height, fontSize };
  });
}

/**
 * Compute single floor-plan-wide safe size (minimum across all markers).
 * Used as fallback if per-marker sizing is not desired.
 */
export function computeUniformMarkerSize(markers: MarkerPoint[]): MarkerSize | null {
  const sizes = computeMarkerSizes(markers);
  if (sizes.length === 0) return null;

  const minDiameter = Math.min(...sizes.map((s) => s.diameter));
  return {
    id: "uniform",
    diameter: minDiameter,
    width: minDiameter * 1.15,
    height: minDiameter * 0.85,
    fontSize: minDiameter * FONT_FRACTION,
  };
}
