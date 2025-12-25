import { NextResponse } from "next/server";
import { uploadImage, uploadVideo, isCloudinaryConfigured } from "@/lib/cloudinary";

// POST /api/upload - Upload file to Cloudinary
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file, folder = "myluxury", type = "image" } = body;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // If Cloudinary is not configured, return the base64 data URL for preview
    // This allows development without Cloudinary setup
    if (!isCloudinaryConfigured()) {
      console.warn("Cloudinary not configured - using base64 data URL for preview");
      return NextResponse.json({
        secure_url: file,
        url: file,
        public_id: `local_${Date.now()}`,
        warning: "Cloudinary not configured - image stored as data URL (not persistent)"
      }, { status: 201 });
    }

    let result;
    if (type === "video") {
      result = await uploadVideo(file, folder);
    } else {
      result = await uploadImage(file, folder);
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    return NextResponse.json({
      secure_url: result.url,
      url: result.url,
      public_id: result.publicId,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
