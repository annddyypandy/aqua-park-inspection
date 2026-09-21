import { describe, expect, it } from 'vitest';
import { computeTargetSize, IMAGE_MAX_SIDE_PX } from './imageProcessing';

describe('computeTargetSize', () => {
  it('does not upscale small images', () => {
    expect(computeTargetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('fits a landscape image to the longest-side budget', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({
      width: IMAGE_MAX_SIDE_PX,
      height: 1440,
    });
  });

  it('fits a portrait phone photo to the longest-side budget', () => {
    expect(computeTargetSize(3024, 4032)).toEqual({
      width: 1440,
      height: IMAGE_MAX_SIDE_PX,
    });
  });

  it('keeps a 1920 image unchanged', () => {
    expect(computeTargetSize(1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });
});
