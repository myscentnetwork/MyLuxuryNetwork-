import sharp from "sharp";

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png" | "auto";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface OptimizationResult {
  buffer: Buffer;
  base64: string;
  format: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

// Quality presets for different use cases
export const QUALITY_PRESETS = {
  thumbnail: { maxWidth: 150, maxHeight: 150, quality: 70, format: "webp" as const },
  small: { maxWidth: 400, maxHeight: 400, quality: 75, format: "webp" as const },
  medium: { maxWidth: 800, maxHeight: 800, quality: 80, format: "webp" as const },
  large: { maxWidth: 1200, maxHeight: 1200, quality: 85, format: "webp" as const },
  xlarge: { maxWidth: 1920, maxHeight: 1920, quality: 85, format: "webp" as const },
  product: { maxWidth: 1000, maxHeight: 1000, quality: 85, format: "webp" as const },
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 80, format: "webp" as const },
  avatar: { maxWidth: 200, maxHeight: 200, quality: 80, format: "webp" as const },
};

/**
 * Convert base64 data URL to buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
}

/**
 * Convert buffer to base64 data URL
 */
export function bufferToBase64(buffer: Buffer, format: string): string {
  const mimeType = format === "webp" ? "image/webp" :
                   format === "avif" ? "image/avif" :
                   format === "png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Optimize an image from base64 string
 * Returns optimized image as base64 and metadata
 */
export async function optimizeImage(
  base64String: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = "webp",
    fit = "inside",
  } = options;

  // Convert base64 to buffer
  const inputBuffer = base64ToBuffer(base64String);
  const originalSize = inputBuffer.length;

  // Create sharp instance
  let sharpInstance = sharp(inputBuffer);

  // Get original metadata
  const metadata = await sharpInstance.metadata();

  // Resize if needed (maintains aspect ratio)
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit,
        withoutEnlargement: true,
      });
    }
  }

  // Determine output format
  let outputFormat = format;
  if (format === "auto") {
    // Use WebP for best compression, fallback to JPEG for compatibility
    outputFormat = "webp";
  }

  // Apply format-specific optimization
  switch (outputFormat) {
    case "webp":
      sharpInstance = sharpInstance.webp({
        quality,
        effort: 6, // Higher effort = better compression
        smartSubsample: true,
      });
      break;
    case "avif":
      sharpInstance = sharpInstance.avif({
        quality,
        effort: 6,
      });
      break;
    case "jpeg":
      sharpInstance = sharpInstance.jpeg({
        quality,
        mozjpeg: true, // Use mozjpeg for better compression
        progressive: true,
      });
      break;
    case "png":
      sharpInstance = sharpInstance.png({
        quality,
        compressionLevel: 9,
        palette: true,
      });
      break;
  }

  // Process the image
  const outputBuffer = await sharpInstance.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    base64: bufferToBase64(outputBuffer, outputFormat),
    format: outputFormat,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
    originalSize,
    optimizedSize: outputBuffer.length,
    compressionRatio: Number(((1 - outputBuffer.length / originalSize) * 100).toFixed(1)),
  };
}

/**
 * Optimize image using a preset
 */
export async function optimizeWithPreset(
  base64String: string,
  preset: keyof typeof QUALITY_PRESETS
): Promise<OptimizationResult> {
  return optimizeImage(base64String, QUALITY_PRESETS[preset]);
}

/**
 * Generate multiple sizes of an image for responsive use
 */
export async function generateResponsiveSizes(
  base64String: string,
  sizes: number[] = [400, 800, 1200, 1920]
): Promise<Map<number, OptimizationResult>> {
  const results = new Map<number, OptimizationResult>();

  for (const size of sizes) {
    const result = await optimizeImage(base64String, {
      maxWidth: size,
      maxHeight: size,
      quality: size <= 400 ? 75 : size <= 800 ? 80 : 85,
      format: "webp",
    });
    results.set(size, result);
  }

  return results;
}

/**
 * Generate Cloudinary URL with optimization transformations
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:low" | "auto:eco" | "auto:good" | "auto:best" | number;
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
    crop?: "fill" | "fit" | "limit" | "scale" | "thumb";
    gravity?: "auto" | "face" | "center";
    dpr?: "auto" | number;
  } = {}
): string {
  const {
    width,
    height,
    quality = "auto:good",
    format = "auto",
    crop = "limit",
    gravity = "auto",
    dpr = "auto",
  } = options;

  // Check if it's a Cloudinary URL
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  // Build transformation string
  const transforms: string[] = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`c_${crop}`);
  transforms.push(`g_${gravity}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);
  transforms.push(`dpr_${dpr}`);

  const transformString = transforms.join(",");

  // Insert transformation into URL
  // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const beforeUpload = url.substring(0, uploadIndex + 8);
  const afterUpload = url.substring(uploadIndex + 8);

  return `${beforeUpload}${transformString}/${afterUpload}`;
}

/**
 * Generate srcset for responsive images from Cloudinary URL
 */
export function generateCloudinarySrcSet(
  url: string,
  widths: number[] = [400, 800, 1200, 1600, 1920]
): string {
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  return widths
    .map((w) => {
      const optimizedUrl = getOptimizedCloudinaryUrl(url, { width: w });
      return `${optimizedUrl} ${w}w`;
    })
    .join(", ");
}

/**
 * Get image dimensions from base64 string
 */
export async function getImageDimensions(
  base64String: string
): Promise<{ width: number; height: number }> {
  const buffer = base64ToBuffer(base64String);
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Check if an image needs optimization
 * Returns true if image is larger than target or in non-optimal format
 */
export async function needsOptimization(
  base64String: string,
  maxSizeKB: number = 500
): Promise<boolean> {
  const buffer = base64ToBuffer(base64String);
  const sizeKB = buffer.length / 1024;

  if (sizeKB > maxSizeKB) return true;

  const metadata = await sharp(buffer).metadata();

  // Check if format is not optimized
  if (metadata.format && !["webp", "avif"].includes(metadata.format)) {
    return true;
  }

  // Check if dimensions are too large
  if (metadata.width && metadata.width > 2000) return true;
  if (metadata.height && metadata.height > 2000) return true;

  return false;
}

export default {
  optimizeImage,
  optimizeWithPreset,
  generateResponsiveSizes,
  getOptimizedCloudinaryUrl,
  generateCloudinarySrcSet,
  getImageDimensions,
  needsOptimization,
  base64ToBuffer,
  bufferToBase64,
  QUALITY_PRESETS,
};
