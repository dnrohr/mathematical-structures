export const MIN_CAMERA_SCALE = 0.5;
export const MAX_CAMERA_SCALE = 6;
export const CAMERA_ZOOM_STEP = 1.25;

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const IDENTITY_CAMERA: Readonly<Camera> = Object.freeze({ x: 0, y: 0, scale: 1 });

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampScale(scale: number): number {
  return Math.min(MAX_CAMERA_SCALE, Math.max(MIN_CAMERA_SCALE, finite(scale, 1)));
}

export interface MarkerDimensions {
  width: number;
  height: number;
}

/**
 * Inverse camera compensation keeps an SVG marker's apparent dimensions
 * constant while its owning edge remains inside the uniformly scaled layer.
 */
export function cameraMarkerDimensions(
  scale: number,
  base: Readonly<MarkerDimensions> = { width: 10, height: 8 },
): MarkerDimensions {
  const boundedScale = clampScale(scale);
  return { width: base.width / boundedScale, height: base.height / boundedScale };
}

/** Keep the transformed content inside a modest overscroll boundary. */
export function clampCamera(
  camera: Camera,
  viewport: Rect,
  content: Rect,
  overscroll = 28,
): Camera {
  const scale = clampScale(camera.scale);
  const scaledWidth = content.width * scale;
  const scaledHeight = content.height * scale;
  const centerX = viewport.x + viewport.width / 2 - (content.x + content.width / 2) * scale;
  const centerY = viewport.y + viewport.height / 2 - (content.y + content.height / 2) * scale;

  const minX = viewport.x + viewport.width - (content.x * scale + scaledWidth) - overscroll;
  const maxX = viewport.x - content.x * scale + overscroll;
  const minY = viewport.y + viewport.height - (content.y * scale + scaledHeight) - overscroll;
  const maxY = viewport.y - content.y * scale + overscroll;

  return {
    x:
      scaledWidth <= viewport.width
        ? centerX
        : Math.min(maxX, Math.max(minX, finite(camera.x, centerX))),
    y:
      scaledHeight <= viewport.height
        ? centerY
        : Math.min(maxY, Math.max(minY, finite(camera.y, centerY))),
    scale,
  };
}

/** Fit content into a viewport without enlarging the deterministic base view. */
export function fitCamera(content: Rect, viewport: Rect, padding = 0): Camera {
  const innerWidth = Math.max(1, viewport.width - padding * 2);
  const innerHeight = Math.max(1, viewport.height - padding * 2);
  const scale = clampScale(
    Math.min(1, innerWidth / Math.max(1, content.width), innerHeight / Math.max(1, content.height)),
  );
  return clampCamera(
    {
      x: viewport.x + viewport.width / 2 - (content.x + content.width / 2) * scale,
      y: viewport.y + viewport.height / 2 - (content.y + content.height / 2) * scale,
      scale,
    },
    viewport,
    content,
  );
}

/** Zoom around a point already expressed in the SVG viewBox coordinate system. */
export function zoomAt(
  camera: Camera,
  nextScale: number,
  anchor: Point,
  viewport: Rect,
  content: Rect,
): Camera {
  const scale = clampScale(nextScale);
  const ratio = scale / camera.scale;
  return clampCamera(
    {
      x: anchor.x - (anchor.x - camera.x) * ratio,
      y: anchor.y - (anchor.y - camera.y) * ratio,
      scale,
    },
    viewport,
    content,
  );
}

export function panBy(camera: Camera, delta: Point, viewport: Rect, content: Rect): Camera {
  return clampCamera(
    { x: camera.x + delta.x, y: camera.y + delta.y, scale: camera.scale },
    viewport,
    content,
  );
}
