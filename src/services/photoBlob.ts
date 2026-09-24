import { PROCESSED_IMAGE_TYPE } from './imageProcessing';
import type { Photo } from '../models';

/**
 * Safari (tab or Home Screen) often returns IndexedDB Blob/File values with
 * size 0 after a reload even when the phone has plenty of free space. Store
 * raw bytes instead and rebuild a JPEG Blob only when reading.
 */
export type StoredPhotoBlob = Blob | ArrayBuffer | ArrayBufferView;

export interface StoredPhoto extends Omit<Photo, 'blob'> {
  blob: StoredPhotoBlob;
}

export async function toStoredBytes(data: StoredPhotoBlob): Promise<Uint8Array> {
  if (data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data.slice(0));
  }

  return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

export async function storedBytesToBlob(
  data: StoredPhotoBlob,
  mimeType: string,
): Promise<Blob> {
  const type = mimeType || PROCESSED_IMAGE_TYPE;
  const bytes = await toStoredBytes(data);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buffer as ArrayBuffer], { type });
}

export async function materializePhoto(record: StoredPhoto): Promise<Photo> {
  return {
    ...record,
    blob: await storedBytesToBlob(record.blob, record.mimeType),
  };
}

export async function materializePhotos(records: StoredPhoto[]): Promise<Photo[]> {
  return Promise.all(records.map((record) => materializePhoto(record)));
}
