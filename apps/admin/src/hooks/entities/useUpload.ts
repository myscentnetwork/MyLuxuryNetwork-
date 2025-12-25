"use client";

import { useState } from "react";

export interface UploadResult {
  url: string;
  publicId: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    base64: string,
    folder: string = "myluxury"
  ): Promise<UploadResult> => {
    try {
      setUploading(true);
      setError(null);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, folder, type: "image" }),
      });

      if (!res.ok) throw new Error("Failed to upload image");
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const uploadVideo = async (
    base64: string,
    folder: string = "myluxury/videos"
  ): Promise<UploadResult> => {
    try {
      setUploading(true);
      setError(null);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, folder, type: "video" }),
      });

      if (!res.ok) throw new Error("Failed to upload video");
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    uploadImage,
    uploadVideo,
  };
}
