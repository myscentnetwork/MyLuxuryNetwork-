import { NextResponse } from "next/server";
import { uploadImage, uploadVideo, uploadImageWithOptions, isCloudinaryConfigured } from "@/lib/cloudinary";
import { QUALITY_PRESETS, optimizeImage, bufferToBase64, base64ToBuffer } from "@/lib/imageOptimizer";

// POST /api/upload - Upload file to Cloudinary with auto-optimization
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      file,
      folder = "myluxury",
      type = "image",
      preset = "product", // Quality preset: thumbnail, small, medium, large, xlarge, product, hero, avatar
      customOptions, // Custom optimization options
    } = body;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // If Cloudinary is not configured, still optimize the image locally
    if (!isCloudinaryConfigured()) {
      console.warn("Cloudinary not configured - optimizing and returning base64");

      if (type === "image") {
        try {
          const presetOptions = QUALITY_PRESETS[preset as keyof typeof QUALITY_PRESETS] || QUALITY_PRESETS.product;
          const optimized = await optimizeImage(file, presetOptions);

          return NextResponse.json({
            secure_url: optimized.base64,
            url: optimized.base64,
            public_id: `local_${Date.now()}`,
            width: optimized.width,
            height: optimized.height,
            format: optimized.format,
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
            compressionRatio: optimized.compressionRatio,
            warning: "Cloudinary not configured - image optimized locally (not persistent)"
          }, { status: 201 });
        } catch {
          // Fallback to original if optimization fails
          return NextResponse.json({
            secure_url: file,
            url: file,
            public_id: `local_${Date.now()}`,
            warning: "Cloudinary not configured - image stored as data URL (not persistent)"
          }, { status: 201 });
        }
      }

      return NextResponse.json({
        secure_url: file,
        url: file,
        public_id: `local_${Date.now()}`,
        warning: "Cloudinary not configured - file stored as data URL (not persistent)"
      }, { status: 201 });
    }

    let result;
    if (type === "video") {
      result = await uploadVideo(file, folder);
    } else if (customOptions) {
      result = await uploadImageWithOptions(file, folder, customOptions);
    } else {
      result = await uploadImage(file, folder, preset as keyof typeof QUALITY_PRESETS);
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    return NextResponse.json({
      secure_url: result.url,
      url: result.url,
      public_id: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      compressionRatio: result.compressionRatio,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
