"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  hint?: string;
  preset?: "thumbnail" | "small" | "medium" | "large" | "xlarge" | "product" | "hero" | "avatar";
  showOptimizationStats?: boolean;
}

interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export function ImageUpload({
  label,
  images,
  onChange,
  multiple = true,
  maxImages = 10,
  hint,
  preset = "product",
  showOptimizationStats = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [lastOptimization, setLastOptimization] = useState<OptimizationStats | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    setUploading(true);
    let totalOriginal = 0;
    let totalOptimized = 0;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file) continue;
      setUploadProgress(`Optimizing image ${i + 1} of ${filesToProcess.length}...`);

      // Read file as base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      try {
        // Upload with optimization
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            preset,
            type: "image",
          }),
        });

        const data = await response.json();

        if (data.secure_url) {
          onChange([...images, data.secure_url]);

          // Track optimization stats
          if (data.originalSize && data.optimizedSize) {
            totalOriginal += data.originalSize;
            totalOptimized += data.optimizedSize;
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
        // Fallback to local base64 if upload fails
        onChange([...images, base64]);
      }
    }

    // Show optimization summary
    if (totalOriginal > 0 && totalOptimized > 0) {
      setLastOptimization({
        originalSize: totalOriginal,
        optimizedSize: totalOptimized,
        compressionRatio: Number(((1 - totalOptimized / totalOriginal) * 100).toFixed(1)),
      });
    }

    setUploading(false);
    setUploadProgress("");
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Move image to a new position
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newImages = [...images];
    const removed = newImages.splice(fromIndex, 1);
    if (removed[0]) {
      newImages.splice(toIndex, 0, removed[0]);
      onChange(newImages);
    }
  };

  // Set image as primary (move to first position)
  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  // Move image left
  const moveLeft = (index: number) => {
    if (index > 0) {
      moveImage(index, index - 1);
    }
  };

  // Move image right
  const moveRight = (index: number) => {
    if (index < images.length - 1) {
      moveImage(index, index + 1);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    // Add drag image
    const target = e.target as HTMLElement;
    if (target) {
      e.dataTransfer.setDragImage(target, 50, 50);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      moveImage(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const inputId = `image-upload-${label?.replace(/\s/g, "-").toLowerCase() || "default"}`;

  return (
    <div className="w-full">
      {label && (
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label}
        </h3>
      )}

      {/* Optimization Stats Badge */}
      {showOptimizationStats && lastOptimization && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-green-400 text-sm font-medium">Images Optimized</p>
            <p className="text-green-300/70 text-xs">
              {formatSize(lastOptimization.originalSize)} → {formatSize(lastOptimization.optimizedSize)}
              <span className="ml-2 text-green-400 font-medium">({lastOptimization.compressionRatio}% smaller)</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastOptimization(null)}
            className="text-green-400/50 hover:text-green-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {images.length < maxImages && (
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading
            ? "border-luxury-gold bg-luxury-gold/5"
            : "border-gray-600 hover:border-luxury-gold"
        }`}>
          <input
            type="file"
            id={inputId}
            accept="image/*"
            multiple={multiple}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor={inputId} className={`${uploading ? "cursor-wait" : "cursor-pointer"}`}>
            {uploading ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3 relative">
                  <div className="absolute inset-0 border-4 border-luxury-gold/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-luxury-gold mb-1">{uploadProgress || "Optimizing..."}</p>
                <p className="text-gray-500 text-sm">Auto-compressing for best quality & performance</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-400 mb-1">Click to upload images</p>
                <p className="text-gray-500 text-sm">Auto-optimized for web • WebP format • High quality</p>
              </>
            )}
          </label>
        </div>
      )}

      {images.length > 0 && (
        <>
          {/* Instructions */}
          <p className="text-gray-500 text-xs mt-4 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Drag to reorder • First image is primary • Click arrows to move
          </p>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {images.map((img, index) => {
              const isPrimary = index === 0;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group aspect-square cursor-grab active:cursor-grabbing transition-all duration-200 ${
                    isDragging ? "opacity-50 scale-95" : ""
                  } ${isDragOver ? "ring-2 ring-luxury-gold ring-offset-2 ring-offset-luxury-dark" : ""}`}
                >
                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute -top-2 -left-2 z-20 bg-luxury-gold text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                      PRIMARY
                    </div>
                  )}

                  {/* Image */}
                  <img
                    src={img}
                    alt={`Image ${index + 1}`}
                    className={`w-full h-full object-contain bg-white rounded-xl border-2 transition-colors ${
                      isPrimary ? "border-luxury-gold" : "border-transparent"
                    }`}
                  />

                  {/* Position indicator */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                    {index + 1}
                  </div>

                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2">
                    {/* Top row: Delete */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Middle row: Move left/right */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveLeft(index)}
                        disabled={index === 0}
                        className={`p-1.5 rounded-full transition-colors ${
                          index === 0
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-white/20 hover:bg-white/40 text-white"
                        }`}
                        title="Move left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRight(index)}
                        disabled={index === images.length - 1}
                        className={`p-1.5 rounded-full transition-colors ${
                          index === images.length - 1
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-white/20 hover:bg-white/40 text-white"
                        }`}
                        title="Move right"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Bottom row: Set as primary */}
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(index)}
                        className="px-2 py-1 bg-luxury-gold hover:bg-yellow-500 text-black text-xs font-semibold rounded-full transition-colors flex items-center gap-1"
                        title="Set as primary image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Set Primary
                      </button>
                    )}
                  </div>

                  {/* Drag handle indicator */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-black/50 rounded">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
