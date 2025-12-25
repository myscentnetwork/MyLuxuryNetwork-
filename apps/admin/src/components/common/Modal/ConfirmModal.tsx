"use client";

/**
 * @fileoverview Confirm Modal Component
 * @module components/common/Modal/ConfirmModal
 *
 * Reusable confirmation dialog for destructive or important actions.
 */

import React from "react";

// ============== TYPES ==============

export type ConfirmModalVariant = "danger" | "warning" | "info";

export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message: string;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Visual variant affecting button color */
  variant?: ConfirmModalVariant;
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Called when confirm is clicked */
  onConfirm: () => void;
  /** Called when cancel is clicked or modal is dismissed */
  onCancel: () => void;
}

// ============== CONFIG ==============

const VARIANT_CLASSES: Record<ConfirmModalVariant, string> = {
  danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
  info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
};

// ============== COMPONENT ==============

/**
 * Confirm Modal Component
 *
 * Modal dialog for confirming actions like delete, approve, etc.
 * Memoized for performance optimization.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showDeleteModal}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteModal(false)}
 * />
 */
export const ConfirmModal = React.memo(function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="relative bg-luxury-dark rounded-lg shadow-xl max-w-md w-full border border-gray-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <h3
            id="modal-title"
            className="text-lg font-semibold text-white mb-2"
          >
            {title}
          </h3>
          <p className="text-gray-400">{message}</p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-900/50 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
