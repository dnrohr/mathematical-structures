import { describe, expect, it } from 'vitest';
import {
  MAX_CAMERA_SCALE,
  MIN_CAMERA_SCALE,
  clampCamera,
  fitCamera,
  panBy,
  zoomAt,
  type Rect,
} from '../src/views/atlas/camera';

const viewport: Rect = { x: 0, y: 0, width: 800, height: 600 };

describe('Atlas camera math', () => {
  it('fits deterministically without enlarging the base constellation', () => {
    expect(fitCamera(viewport, viewport)).toEqual({ x: 0, y: 0, scale: 1 });
    expect(fitCamera({ x: 0, y: 0, width: 400, height: 200 }, viewport)).toEqual({
      x: 200,
      y: 200,
      scale: 1,
    });
    expect(fitCamera({ x: 0, y: 0, width: 1600, height: 600 }, viewport)).toEqual({
      x: 0,
      y: 150,
      scale: 0.5,
    });
  });

  it('keeps the graph point under the pointer fixed while zooming', () => {
    const anchor = { x: 200, y: 150 };
    const next = zoomAt({ x: 0, y: 0, scale: 1 }, 2, anchor, viewport, viewport);
    expect(next).toEqual({ x: -200, y: -150, scale: 2 });
    expect((anchor.x - next.x) / next.scale).toBeCloseTo(anchor.x);
    expect((anchor.y - next.y) / next.scale).toBeCloseTo(anchor.y);
  });

  it('bounds scale and extreme translation while allowing modest overscroll', () => {
    expect(clampCamera({ x: 99_999, y: -99_999, scale: 99 }, viewport, viewport)).toEqual({
      x: 28,
      y: -3028,
      scale: MAX_CAMERA_SCALE,
    });
    expect(clampCamera({ x: 10, y: 10, scale: 0.01 }, viewport, viewport)).toEqual({
      x: 200,
      y: 150,
      scale: MIN_CAMERA_SCALE,
    });
  });

  it('pans uniformly and clamps both axes at the content boundary', () => {
    const zoomed = { x: -400, y: -300, scale: 2 };
    expect(panBy(zoomed, { x: 40, y: -20 }, viewport, viewport)).toEqual({
      x: -360,
      y: -320,
      scale: 2,
    });
    expect(panBy(zoomed, { x: 10_000, y: 10_000 }, viewport, viewport)).toEqual({
      x: 28,
      y: 28,
      scale: 2,
    });
  });
});
