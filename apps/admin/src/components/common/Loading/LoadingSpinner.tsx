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

// ============== SKELETON COMPONENTS ==============

/**
 * Skeleton Pulse Animation Base
 */
const skeletonBase = "animate-pulse bg-luxury-gray/50 rounded";

/**
 * Table Skeleton Component
 *
 * Displays a skeleton loading state for tables.
 *
 * @example
 * if (loading) return <TableSkeleton rows={5} columns={4} />;
 */
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = React.memo(function TableSkeleton({
  rows = 5,
  columns = 4,
}: TableSkeletonProps) {
  return (
    <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
      {/* Header */}
      <div className="bg-luxury-black p-4 border-b border-luxury-gray">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={`${skeletonBase} h-4 w-3/4`} />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 border-b border-luxury-gray last:border-b-0"
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`${skeletonBase} h-4`}
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Card Skeleton Component
 *
 * Displays a skeleton loading state for cards.
 */
export const CardSkeleton = React.memo(function CardSkeleton() {
  return (
    <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
      <div className={`${skeletonBase} h-6 w-3/4 mb-4`} />
      <div className={`${skeletonBase} h-4 w-full mb-2`} />
      <div className={`${skeletonBase} h-4 w-2/3 mb-4`} />
      <div className={`${skeletonBase} h-10 w-1/3`} />
    </div>
  );
});

/**
 * Product Grid Skeleton Component
 *
 * Displays a skeleton loading state for product grids.
 */
export interface ProductGridSkeletonProps {
  count?: number;
}

export const ProductGridSkeleton = React.memo(function ProductGridSkeleton({
  count = 8,
}: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
          <div className={`${skeletonBase} aspect-square`} />
          <div className="p-4">
            <div className={`${skeletonBase} h-3 w-1/2 mb-2`} />
            <div className={`${skeletonBase} h-5 w-3/4 mb-2`} />
            <div className={`${skeletonBase} h-3 w-1/3 mb-3`} />
            <div className={`${skeletonBase} h-6 w-1/2 mb-3`} />
            <div className={`${skeletonBase} h-10 w-full`} />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Stats Card Skeleton Component
 */
export const StatsCardSkeleton = React.memo(function StatsCardSkeleton() {
  return (
    <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${skeletonBase} h-10 w-10 rounded-lg`} />
        <div className={`${skeletonBase} h-4 w-16`} />
      </div>
      <div className={`${skeletonBase} h-8 w-24 mb-2`} />
      <div className={`${skeletonBase} h-4 w-32`} />
    </div>
  );
});
