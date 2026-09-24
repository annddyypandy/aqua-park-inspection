export const IMAGE_MAX_SIDE_PX = 1920;
export const JPEG_QUALITY = 0.86;
export const PROCESSED_IMAGE_TYPE = 'image/jpeg';

export interface PixelSize {
  width: number;
  height: number;
}

/**
 * Fit within maxSide without upscaling. 1920 keeps damage visible in reports
 * without storing full smartphone resolution in IndexedDB.
 */
export function computeTargetSize(
  width: number,
  height: number,
  maxSide = IMAGE_MAX_SIDE_PX,
): PixelSize {
  if (width <= 0 || height <= 0) {
    throw new Error('Image has invalid dimensions.');
  }

  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return { width, height };
  }

  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function blobToBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      try {
        return await createImageBitmap(blob);
      } catch {
        return loadHtmlImage(blob);
      }
    }
  }

  return loadHtmlImage(blob);
}

function loadHtmlImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photograph.'));
    };
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress this photograph.'));
          return;
        }
        resolve(blob);
      },
      PROCESSED_IMAGE_TYPE,
      JPEG_QUALITY,
    );
  });
}

export async function processInspectionImage(file: Blob): Promise<Blob> {
  const source = await blobToBitmap(file);
  const target = computeTargetSize(source.width, source.height);

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare this photograph for storage.');
  }

  context.drawImage(source, 0, 0, target.width, target.height);

  if ('close' in source) {
    source.close();
  }

  return canvasToJpeg(canvas);
}
