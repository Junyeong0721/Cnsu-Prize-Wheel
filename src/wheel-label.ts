export const LABEL_MAX_FONT = 18;
export const LABEL_OUTER_RADIUS = 204;
export const LABEL_INNER_RADIUS = 65;
export const LABEL_EDGE_GAP = 1.2;

// Width and height are measured from the complete name at LABEL_MAX_FONT.
export function fitWheelLabel(
  span: number,
  width: number,
  height: number,
): number {
  if (span <= 0 || width <= 0 || height <= 0) return LABEL_MAX_FONT;
  let scale = Math.min(1, (LABEL_OUTER_RADIUS - LABEL_INNER_RADIUS) / width);
  if (span < 180) {
    const slope = Math.tan((span * Math.PI) / 360);
    scale = Math.min(
      scale,
      (LABEL_OUTER_RADIUS * slope - LABEL_EDGE_GAP) /
        (height / 2 + width * slope),
    );
  }
  return LABEL_MAX_FONT * Math.max(0, scale);
}
