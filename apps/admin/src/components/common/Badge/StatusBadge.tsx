"use client";

/**
 * @fileoverview Status Badge Component
 * @module components/common/Badge/StatusBadge
 *
 * Reusable status badge for displaying entity states.
 * Supports various status types with appropriate color coding.
 */

import React from "react";

// ============== TYPES ==============

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "in_stock"
  | "out_of_stock"
  | "paid"
  | "cancelled";

export interface StatusBadgeProps {
  /** The status to display */
  status: StatusType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional className for additional styling */
  className?: string;
}

// ============== CONFIG ==============

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-green-500/20 text-green-400",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-500/20 text-gray-400",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-500/20 text-yellow-400",
  },
  approved: {
    label: "Approved",
    className: "bg-green-500/20 text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/20 text-red-400",
  },
  in_stock: {
    label: "In Stock",
    className: "bg-green-500/20 text-green-400",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-500/20 text-red-400",
  },
  paid: {
    label: "Paid",
    className: "bg-green-500/20 text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/20 text-red-400",
  },
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

// ============== COMPONENT ==============

/**
 * Status Badge Component
 *
 * Displays a colored badge indicating entity status.
 * Memoized for performance optimization.
 *
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" size="lg" />
 */
export const StatusBadge = React.memo(function StatusBadge({
  status,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-500/20 text-gray-400" };
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
});
