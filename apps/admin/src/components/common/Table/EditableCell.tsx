"use client";

/**
 * @fileoverview Editable Cell Component
 * @module components/common/Table/EditableCell
 *
 * Inline editable cell for table values with save/cancel functionality.
 * Supports text, number, and currency input types.
 */

import React, { useState, useRef, useEffect } from "react";

// ============== TYPES ==============

export type EditableCellType = "text" | "number" | "currency";

export interface EditableCellProps {
  /** Current value */
  value: string | number;
  /** Called when value is saved */
  onSave: (newValue: string | number) => Promise<void>;
  /** Input type */
  type?: EditableCellType;
  /** CSS class for the display value */
  displayClassName?: string;
  /** Currency symbol for currency type */
  currencySymbol?: string;
  /** Minimum value for number/currency types */
  min?: number;
  /** Whether the cell is disabled */
  disabled?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
}

// ============== COMPONENT ==============

/**
 * Editable Cell Component
 *
 * Click-to-edit cell with inline input and save/cancel buttons.
 * Automatically handles focus, blur, and keyboard events.
 *
 * @example
 * <EditableCell
 *   value={product.price}
 *   type="currency"
 *   onSave={async (newPrice) => await updateProduct(id, { price: newPrice })}
 * />
 */
export function EditableCell({
  value,
  onSave,
  type = "text",
  displayClassName = "",
  currencySymbol = "₹",
  min = 0,
  disabled = false,
  placeholder = "-",
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSave = async () => {
    if (saving) return;

    const newValue = type === "text" ? editValue : Number(editValue);

    // Skip if value hasn't changed
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      // Reset to original value on error
      setEditValue(String(value));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Format display value
  const formatValue = (val: string | number): string => {
    if (val === "" || val === null || val === undefined) return placeholder;

    if (type === "currency") {
      const numVal = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(numVal)) return placeholder;
      return `${currencySymbol}${numVal.toLocaleString("en-IN")}`;
    }

    if (type === "number") {
      const numVal = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(numVal)) return placeholder;
      return numVal.toLocaleString("en-IN");
    }

    return String(val);
  };

  if (disabled) {
    return (
      <span className={`${displayClassName} opacity-50`}>
        {formatValue(value)}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === "currency" && (
          <span className="text-gray-400 text-sm">{currencySymbol}</span>
        )}
        <input
          ref={inputRef}
          type={type === "text" ? "text" : "number"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          min={type !== "text" ? min : undefined}
          className="w-20 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:border-luxury-gold focus:outline-none"
          disabled={saving}
        />
        {saving && (
          <span className="text-xs text-gray-400">...</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`${displayClassName} cursor-pointer hover:underline hover:decoration-dotted focus:outline-none focus:underline`}
      title="Click to edit"
    >
      {formatValue(value)}
    </button>
  );
}
