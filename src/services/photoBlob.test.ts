import { describe, expect, it } from 'vitest';
import { storedBytesToBlob, toStoredBytes } from './photoBlob';

describe('storedBytesToBlob', () => {
  it('rebuilds a jpeg blob from raw bytes so Safari can display it', async () => {
    const buffer = await new Blob(['jpeg-bytes']).arrayBuffer();
    const blob = await storedBytesToBlob(buffer, 'image/jpeg');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
    expect(await blob.text()).toBe('jpeg-bytes');
  });

  it('rebuilds from a Uint8Array view', async () => {
    const bytes = new TextEncoder().encode('jpeg-bytes');
    const blob = await storedBytesToBlob(bytes, 'image/jpeg');
    expect(await blob.text()).toBe('jpeg-bytes');
  });

  it('re-wraps an existing blob with the stored mime type', async () => {
    const source = new Blob(['jpeg-bytes'], { type: '' });
    const blob = await storedBytesToBlob(source, 'image/jpeg');
    expect(blob.type).toBe('image/jpeg');
    expect(await blob.text()).toBe('jpeg-bytes');
  });

  it('copies bytes so the stored buffer is not shared', async () => {
    const original = new Uint8Array([1, 2, 3]);
    const stored = await toStoredBytes(original);
    original[0] = 9;
    expect(Array.from(stored)).toEqual([1, 2, 3]);
  });
});