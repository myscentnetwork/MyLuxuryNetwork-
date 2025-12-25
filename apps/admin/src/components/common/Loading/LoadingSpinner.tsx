"use client";

/**
 * @fileoverview Loading Spinner Component
 * @module components/common/Loading/LoadingSpinner
 *
 * Reusable loading indicator for async operations.
 */

import React from "react";

// ============== TYPES ==============

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional text to display below spinner */
  text?: string;
  /** Whether to center in parent container */
  centered?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

// ============== CONFIG ==============

const SIZE_CLASSES: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

// ============== COMPONENT ==============

/**
 * Loading Spinner Component
 *
 * Animated spinner for indicating loading states.
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" text="Loading products..." centered />
 */
export const LoadingSpinner = React.memo(function LoadingSpinner({
  size = "md",
  text,
  centered = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_CLASSES[size];
  const wrapperClass = centered ? "flex flex-col items-center justify-center" : "";

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-600 border-t-gray-300 ${sizeClass}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-2 text-sm text-gray-400">{text}</p>
      )}
    </div>
  );
});

// ============== FULL PAGE LOADING ==============

export interface PageLoadingProps {
  /** Text to display */
  text?: string;
}

/**
 * Full Page Loading Component
 *
 * Full-height centered loading state for pages.
 *
 * @example
 * if (loading) return <PageLoading text="Loading dashboard..." />;
 */
export function PageLoading({ text = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center h-96">
      <LoadingSpinner size="lg" text={text} centered />
    </div>
  );
}
