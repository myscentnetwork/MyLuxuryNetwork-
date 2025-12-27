"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onClick?: () => void;
  showLoader?: boolean;
  fallbackSrc?: string;
}

// Generate optimized Cloudinary URL
function getOptimizedUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  const { width, height, quality = 85, format = "auto" } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push("c_limit");
  transforms.push("g_auto");
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);
  transforms.push("dpr_auto");

  const transformString = transforms.join(",");

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const beforeUpload = url.substring(0, uploadIndex + 8);
  const afterUpload = url.substring(uploadIndex + 8);

  // Remove existing transformations if any
  const cleanAfterUpload = afterUpload.replace(/^[^/]+\//, (match) => {
    // Check if this looks like a transformation (contains common transform prefixes)
    if (/^(w_|h_|c_|q_|f_|g_|dpr_)/.test(match)) {
      return "";
    }
    return match;
  });

  return `${beforeUpload}${transformString}/${cleanAfterUpload}`;
}

// Generate blur placeholder URL
function getBlurUrl(url: string): string {
  if (!url || !url.includes("cloudinary.com")) {
    return "";
  }

  const transforms = "w_10,h_10,c_fill,q_10,f_auto,e_blur:1000";

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const beforeUpload = url.substring(0, uploadIndex + 8);
  const afterUpload = url.substring(uploadIndex + 8);

  return `${beforeUpload}${transforms}/${afterUpload}`;
}

// Generate srcset for responsive images
function generateSrcSet(url: string, widths: number[] = [400, 800, 1200, 1600]): string {
  if (!url || !url.includes("cloudinary.com")) {
    return "";
  }

  return widths
    .map((w) => `${getOptimizedUrl(url, { width: w })} ${w}w`)
    .join(", ");
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  objectFit = "cover",
  onClick,
  showLoader = true,
  fallbackSrc = "/placeholder-image.svg",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get optimized URL
  const optimizedSrc = useMemo(() => {
    if (!src) return fallbackSrc;
    if (error) return fallbackSrc;
    return getOptimizedUrl(src, { width, height, quality });
  }, [src, width, height, quality, error, fallbackSrc]);

  // Get blur placeholder
  const blurPlaceholder = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (!src || !src.includes("cloudinary.com")) return undefined;
    return getBlurUrl(src);
  }, [src, blurDataURL]);

  // Check if it's a data URL (base64)
  const isDataUrl = src?.startsWith("data:");

  // For data URLs, use regular img tag
  if (isDataUrl) {
    return (
      <div className={`relative ${fill ? "w-full h-full" : ""}`}>
        {showLoader && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-luxury-gray/50 animate-pulse">
            <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={`${className} ${fill ? "w-full h-full object-${objectFit}" : ""} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          style={fill ? { objectFit } : undefined}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          onClick={onClick}
        />
      </div>
    );
  }

  // For Cloudinary URLs, use Next.js Image
  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {showLoader && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-luxury-gray/50 animate-pulse z-10">
          <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
        </div>
      )}
      <Image
        src={error ? fallbackSrc : optimizedSrc}
        alt={alt}
        width={fill ? undefined : width || 400}
        height={fill ? undefined : height || 400}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={{ objectFit }}
        placeholder={blurPlaceholder && placeholder === "blur" ? "blur" : "empty"}
        blurDataURL={blurPlaceholder}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        onClick={onClick}
        unoptimized={src?.startsWith("data:") || src?.startsWith("blob:")}
      />
    </div>
  );
}

// Export utility functions
export { getOptimizedUrl, getBlurUrl, generateSrcSet };
