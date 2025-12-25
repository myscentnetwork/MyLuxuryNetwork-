"use client";

/**
 * @fileoverview Empty State Component
 * @module components/common/EmptyState/EmptyState
 *
 * Reusable empty state display for lists and tables.
 */

import React from "react";

// ============== TYPES ==============

export interface EmptyStateProps {
  /** Icon to display (as emoji or component) */
  icon?: React.ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional className for additional styling */
  className?: string;
}

// ============== COMPONENT ==============

/**
 * Empty State Component
 *
 * Display when there are no items in a list or table.
 * Memoized for performance optimization.
 *
 * @example
 * <EmptyState
 *   icon="📦"
 *   title="No products found"
 *   description="Get started by adding your first product."
 *   action={{ label: "Add Product", onClick: () => router.push('/new') }}
 * />
 */
export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="text-4xl mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
