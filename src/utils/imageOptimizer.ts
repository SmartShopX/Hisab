/**
 * Smart Client-side Image Optimization & Auto-WebP Converter
 * Converts images (PNG, JPG, HEIC, BMP, etc.) into modern high-efficiency WebP format
 * with dynamic resizing, compression, and metric tracking.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  maxSizeBytes?: number; // If set, performs iterative quality adjustment
}

export interface OptimizationResult {
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  savedPercentage: number;
  width: number;
  height: number;
  format: string;
  originalFormat: string;
  originalName: string;
}

/**
 * Format bytes to readable human string (e.g. 1.2 MB, 45 KB)
 */
export const formatBytes = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Loads an image from a File, Blob, or Data URL / Image URL
 */
const loadImage = (source: File | Blob | string): Promise<{ img: HTMLImageElement; originalSize: number; originalFormat: string; originalName: string }> => {
  return new Promise((resolve, reject) => {
    let originalSize = 0;
    let originalFormat = 'unknown';
    let originalName = 'image';

    if (source instanceof File) {
      originalSize = source.size;
      originalFormat = source.type || 'image/jpeg';
      originalName = source.name;
    } else if (source instanceof Blob) {
      originalSize = source.size;
      originalFormat = source.type || 'image/jpeg';
      originalName = 'image.blob';
    } else if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        const matches = source.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        if (matches) {
          originalFormat = matches[1];
        }
        // Approximate base64 decoded size
        const base64Data = source.split(',')[1] || '';
        originalSize = Math.round((base64Data.length * 3) / 4);
      } else {
        originalSize = 100 * 1024; // fallback estimation
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({ img, originalSize, originalFormat, originalName });
    };

    img.onerror = (err) => {
      reject(new Error('ইমেজ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক ছবির ফাইল নির্বাচন করুন।'));
    };

    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
};

/**
 * Optimizes an image and automatically converts it to WebP format.
 */
export const optimizeImage = async (
  source: File | Blob | string,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = 'image/webp',
    maxSizeBytes,
  } = options;

  const { img, originalSize, originalFormat, originalName } = await loadImage(source);

  // Calculate new dimensions preserving aspect ratio
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const widthRatio = maxWidth / targetWidth;
    const heightRatio = maxHeight / targetHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Canvas 2D context পাওয়া যায়নি');
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Function to create blob with given quality
  const getBlob = (q: number): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback if browser doesn't support target format
            canvas.toBlob(
              (fallbackBlob) => {
                resolve(fallbackBlob || new Blob([], { type: 'image/jpeg' }));
              },
              'image/jpeg',
              q
            );
          }
        },
        format,
        q
      );
    });
  };

  let currentQuality = quality;
  let blob = await getBlob(currentQuality);

  // If maxSizeBytes is specified and initial blob exceeds it, iteratively reduce quality
  if (maxSizeBytes && blob.size > maxSizeBytes && currentQuality > 0.3) {
    while (blob.size > maxSizeBytes && currentQuality > 0.3) {
      currentQuality -= 0.12;
      blob = await getBlob(currentQuality);
    }
  }

  // Convert blob to DataURL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const optimizedSize = blob.size;
  const initialSize = originalSize > 0 ? originalSize : optimizedSize;
  const savedBytes = Math.max(0, initialSize - optimizedSize);
  const savedPercentage = initialSize > 0 ? Math.round((savedBytes / initialSize) * 100) : 0;

  return {
    dataUrl,
    blob,
    originalSize: initialSize,
    optimizedSize,
    savedPercentage,
    width: targetWidth,
    height: targetHeight,
    format: blob.type || format,
    originalFormat,
    originalName: originalName.replace(/\.[^/.]+$/, '') + '.webp',
  };
};

/**
 * Optimizes a shop logo or avatar with square crop/fit presets
 */
export const optimizeLogo = async (
  source: File | Blob | string,
  maxDimension: number = 512
): Promise<OptimizationResult> => {
  return optimizeImage(source, {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
    quality: 0.85,
    format: 'image/webp',
  });
};

/**
 * Optimizes product photos with balanced quality for e-commerce
 */
export const optimizeProductImage = async (
  source: File | Blob | string,
  maxDimension: number = 1200
): Promise<OptimizationResult> => {
  return optimizeImage(source, {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
    quality: 0.82,
    format: 'image/webp',
  });
};

/**
 * Batch optimize multiple images
 */
export const optimizeMultipleImages = async (
  sources: (File | Blob | string)[],
  options?: ImageOptimizationOptions
): Promise<OptimizationResult[]> => {
  const promises = sources.map((s) => optimizeImage(s, options));
  return Promise.all(promises);
};
