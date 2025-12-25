import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
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
 * Upload a base64 image to Cloudinary
 * Returns null if Cloudinary is not configured (graceful fallback)
 */
export async function uploadImage(
  base64Data: string,
  folder: string = "myluxury"
): Promise<UploadResult | null> {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary not configured - skipping image upload");
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
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
