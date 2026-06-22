// Shared helpers for marker display across floor plan pages
// Provides consistent sizing and initials extraction

export interface MarkerSize {
  diameter: number;
  fontSize: number;
}

/**
 * Calculate marker circle diameter and font size based on zoom level.
 * @param baseDiameter Base diameter at 100% zoom (in pixels)
 * @param zoom Current zoom percentage (e.g., 100, 150, 200)
 * @returns Object with computed diameter and fontSize
 */
export function getMarkerSize(baseDiameter: number, zoom: number): MarkerSize {
  const diameter = baseDiameter * (zoom / 100);
  const fontSize = diameter * 0.35; // 35% of diameter for readable text
  return { diameter, fontSize };
}

/**
 * Extract initials from a name string.
 * Takes the first letter of each word, uppercase, max 2 letters.
 * @param name Full name (e.g., "John Doe" → "JD")
 * @returns Initials string (max 2 chars)
 */
export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
