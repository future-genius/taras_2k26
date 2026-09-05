/**
 * TARAS 2K26 — Client-Side Payment Proof Image Compression & Optimization Utility
 *
 * Implements browser-based image resizing and compression using HTML5 Canvas API:
 * - Maximum input file size: 1 MB (1,048,576 bytes)
 * - Maximum resolution: 1600 px (aspect ratio preserved, no upscaling)
 * - Preferred format: WebP (with fallback to JPEG)
 * - Quality: 0.75 - 0.82 (optimized for text readability of UTR, amount, date)
 * - Target output size: 200 KB - 800 KB
 */

export const MAX_INPUT_FILE_SIZE_BYTES = 1048576; // 1 MB (1,048,576 bytes)
export const MAX_SCREENSHOT_DIMENSION_PX = 1600; // 1600 px max dimension
export const DEFAULT_COMPRESSION_QUALITY = 0.82; // Sweet spot for text sharpness & small size
export const TARGET_MAX_SIZE_BYTES = 800 * 1024; // 800 KB target threshold

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImageResult {
  /** The optimized File ready for Firebase Storage upload */
  file: File;
  /** The optimized Blob */
  blob: Blob;
  /** Object URL for high-performance preview */
  previewUrl: string;
  /** Original file size in bytes */
  originalSize: number;
  /** Optimized file size in bytes */
  optimizedSize: number;
  /** Human-readable original size (e.g. "3.8 MB") */
  originalSizeFormatted: string;
  /** Human-readable optimized size (e.g. "620 KB") */
  optimizedSizeFormatted: string;
  /** Compression reduction percentage (e.g. 84) */
  reductionPercent: number;
  /** Output width in pixels */
  width: number;
  /** Output height in pixels */
  height: number;
  /** Format of the output file */
  format: 'image/webp' | 'image/jpeg';
  /** Original file name */
  originalFileName: string;
}

/**
 * Format bytes into human-readable size (e.g., "3.8 MB", "620 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate input screenshot file prior to processing
 */
export function validateScreenshotFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a payment screenshot.' };
  }

  // 1. Check file size <= 1 MB (1,048,576 bytes)
  if (file.size > MAX_INPUT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Payment proof file must be 1 MB (1,048,576 bytes) or smaller.',
    };
  }

  // 2. Check MIME type and extension
  const isAllowedMime = file.type && ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());
  const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.test(file.name);

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload JPG, JPEG, PNG, WebP, or PDF.',
    };
  }

  return { valid: true };
}

/**
 * Helper to load an image from a File or Blob into an HTMLImageElement
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression. The image file might be corrupted.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress and resize screenshot in-browser using Canvas API
 */
export async function compressPaymentScreenshot(
  file: File,
  targetDimension: number = MAX_SCREENSHOT_DIMENSION_PX,
  initialQuality: number = DEFAULT_COMPRESSION_QUALITY
): Promise<OptimizedImageResult> {
  // Validate input first
  const validation = validateScreenshotFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Load image
  const img = await loadImageFromFile(file);

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (!origWidth || !origHeight) {
    throw new Error('Unable to read image dimensions. Please try another screenshot.');
  }

  // Calculate new dimensions (cap at targetDimension, maintain aspect ratio, never upscale)
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  const maxDimension = Math.max(origWidth, origHeight);
  if (maxDimension > targetDimension) {
    const scale = targetDimension / maxDimension;
    targetWidth = Math.round(origWidth * scale);
    targetHeight = Math.round(origHeight * scale);
  }

  // Setup offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable in browser.');
  }

  // Use high-quality smoothing for sharp text edges
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill canvas with white background (in case of transparent PNG screenshots)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Attempt WebP export, falling back to JPEG if WebP is unsupported
  let exportMime: 'image/webp' | 'image/jpeg' = 'image/webp';
  let quality = initialQuality;

  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), exportMime, quality)
  );

  // Check if browser actually generated WebP (some older browsers return PNG/JPEG)
  if (!blob || (blob.type && blob.type !== 'image/webp')) {
    exportMime = 'image/jpeg';
    blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), exportMime, quality)
    );
  }

  // If the file is still larger than target (~850 KB) and quality can be tuned slightly
  if (blob && blob.size > TARGET_MAX_SIZE_BYTES && quality > 0.72) {
    quality = 0.75;
    const secondPassBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), exportMime, quality)
    );
    if (secondPassBlob && secondPassBlob.size < blob.size) {
      blob = secondPassBlob;
    }
  }

  if (!blob) {
    throw new Error('Image compression failed. Please try again or select another image.');
  }

  // Generate clean output filename
  const extension = exportMime === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const optimizedFileName = `${baseName || 'payment_proof'}_optimized.${extension}`;

  const optimizedFile = new File([blob], optimizedFileName, {
    type: exportMime,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);
  const reductionPercent = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

  return {
    file: optimizedFile,
    blob,
    previewUrl,
    originalSize: file.size,
    optimizedSize: blob.size,
    originalSizeFormatted: formatFileSize(file.size),
    optimizedSizeFormatted: formatFileSize(blob.size),
    reductionPercent,
    width: targetWidth,
    height: targetHeight,
    format: exportMime,
    originalFileName: file.name,
  };
}

/**
 * Release preview URL to prevent browser memory leaks
 */
export function revokeOptimizedImagePreview(previewUrl?: string): void {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(previewUrl);
    } catch {
      // Ignored
    }
  }
}
