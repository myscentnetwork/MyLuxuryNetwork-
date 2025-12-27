import { v2 as cloudinary } from "cloudinary";
import { optimizeImage, QUALITY_PRESETS, type OptimizationOptions } from "./imageOptimizer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: number;
}

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return !!(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== "your_cloud_name" &&
    apiKey !== "your_api_key" &&
    apiSecret !== "your_api_secret"
  );
}

/**
 * Upload a base64 image to Cloudinary with auto-optimization
 * Images are optimized locally before upload for best quality/size ratio
 * Returns null if Cloudinary is not configured (graceful fallback)
 */
export async function uploadImage(
  base64Data: string,
  folder: string = "myluxury",
  preset: keyof typeof QUALITY_PRESETS = "product"
): Promise<UploadResult | null> {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary not configured - skipping image upload");
    return null;
  }

  try {
    // Get optimization settings from preset
    const optimizationSettings = QUALITY_PRESETS[preset];

    // Optimize image locally before uploading
    const optimized = await optimizeImage(base64Data, {
      maxWidth: optimizationSettings.maxWidth,
      maxHeight: optimizationSettings.maxHeight,
      quality: optimizationSettings.quality,
      format: optimizationSettings.format,
    });

    console.log(
      `Image optimized: ${(optimized.originalSize / 1024).toFixed(1)}KB → ${(optimized.optimizedSize / 1024).toFixed(1)}KB (${optimized.compressionRatio}% reduction)`
    );

    // Upload optimized image to Cloudinary
    const result = await cloudinary.uploader.upload(optimized.base64, {
      folder,
      resource_type: "image",
      format: optimized.format,
      transformation: [
        { quality: "auto:best" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: optimized.width,
      height: optimized.height,
      format: optimized.format,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      compressionRatio: optimized.compressionRatio,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

/**
 * Upload image with custom optimization options
 */
export async function uploadImageWithOptions(
  base64Data: string,
  folder: string = "myluxury",
  options: OptimizationOptions = {}
): Promise<UploadResult | null> {
  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary not configured - skipping image upload");
    return null;
  }

  try {
    // Optimize image with custom options
    const optimized = await optimizeImage(base64Data, options);

    console.log(
      `Image optimized: ${(optimized.originalSize / 1024).toFixed(1)}KB → ${(optimized.optimizedSize / 1024).toFixed(1)}KB (${optimized.compressionRatio}% reduction)`
    );

    const result = await cloudinary.uploader.upload(optimized.base64, {
      folder,
      resource_type: "image",
      format: optimized.format,
      transformation: [
        { quality: "auto:best" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: optimized.width,
      height: optimized.height,
      format: optimized.format,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      compressionRatio: optimized.compressionRatio,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

/**
 * Upload a video to Cloudinary
 * Returns null if Cloudinary is not configured (graceful fallback)
 */
export async function uploadVideo(
  base64Data: string,
  folder: string = "myluxury/videos"
): Promise<UploadResult | null> {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary not configured - skipping video upload");
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "video",
      transformation: [
        { quality: "auto:good" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary video upload error:", error);
    return null;
  }
}

/**
 * Delete an asset from Cloudinary by public ID
 */
export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches?.[1] ?? null;
  } catch {
    return null;
  }
}

export default cloudinary;
