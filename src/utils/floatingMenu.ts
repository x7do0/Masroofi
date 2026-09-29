export interface MenuRect { left: number; top: number; right: number; bottom: number }

/** Coordinates are in the layout viewport, including visualViewport offsets. */
export function placeFloatingMenu(
  anchor: MenuRect,
  size: { width: number; height: number },
  viewport: MenuRect,
  blockers: readonly MenuRect[] = [],
): { left: number; top: number; maxHeight: number } {
  const edge = 8;
  const gap = 6;
  const minTop = viewport.top + edge;
  const left = Math.max(viewport.left + edge, Math.min(anchor.left, viewport.right - edge - size.width));
  let bottom = viewport.bottom - edge;
  for (const blocker of blockers) {
    if (left < blocker.right && left + size.width > blocker.left && blocker.bottom > minTop) {
      bottom = Math.min(bottom, blocker.top - edge);
    }
  }
  const maxHeight = Math.max(0, bottom - minTop);
  const height = Math.min(size.height, maxHeight);
  const below = anchor.bottom + gap;
  const preferredTop = below + height <= bottom ? below : anchor.top - gap - height;
  return { left, top: Math.max(minTop, Math.min(preferredTop, bottom - height)), maxHeight };
}
