"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useProducts, Product } from "@/src/hooks/entities";

type PriceType = "wholesalePrice" | "resellerPrice" | "retailPrice";

const priceTypeLabels: Record<PriceType, string> = {
  wholesalePrice: "Wholesale Price",
  resellerPrice: "Reseller Price",
  retailPrice: "Retail Price",
};

const priceTypeColors: Record<PriceType, string> = {
  wholesalePrice: "text-green-400",
  resellerPrice: "text-blue-400",
  retailPrice: "text-purple-400",
};

// Inline Editable Price Component - Memoized
const EditablePrice = memo(function EditablePrice({
  productId,
  field,
  value,
  colorClass,
  onUpdate,
}: {
  productId: string;
  field: "mrp" | "costPrice" | "wholesalePrice" | "resellerPrice" | "retailPrice";
  value: number;
  colorClass: string;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || "");
  const [saving, setSaving] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || "");
  }, [value]);

  const handleSave = async () => {
    const newValue = parseFloat(editValue) || 0;
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to update");
      }

      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update price:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to update"}`);
      setEditValue(value?.toString() || "");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value?.toString() || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">₹</span>
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className={`w-20 px-2 py-1 bg-luxury-gray border rounded text-sm text-right focus:outline-none focus:ring-2 ${
            saving ? "opacity-50" : ""
          } ${colorClass} border-gray-500 focus:ring-luxury-gold`}
          min="0"
          step="0.01"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`${colorClass} font-medium text-sm hover:bg-luxury-gray/50 px-2 py-1 rounded transition-colors cursor-text text-right w-full`}
      title="Click to edit"
    >
      {value ? `₹${value.toFixed(2)}` : "-"}
    </button>
  );
});

// Auto Markup Settings Modal
function AutoMarkupSettingsModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Wholesale settings
  const [wholesaleMarkupType, setWholesaleMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [wholesaleMarkupValue, setWholesaleMarkupValue] = useState<string>("");

  // Reseller settings
  const [resellerMarkupType, setResellerMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [resellerMarkupValue, setResellerMarkupValue] = useState<string>("");

  // Retail settings
  const [retailMarkupType, setRetailMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [retailMarkupValue, setRetailMarkupValue] = useState<string>("");

  // Apply to existing products
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [overrideExisting, setOverrideExisting] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/auto-markup");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setWholesaleMarkupType(data.settings.wholesaleMarkupType || "percentage");
            setWholesaleMarkupValue(data.settings.wholesaleMarkupValue?.toString() || "");
            setResellerMarkupType(data.settings.resellerMarkupType || "percentage");
            setResellerMarkupValue(data.settings.resellerMarkupValue?.toString() || "");
            setRetailMarkupType(data.settings.retailMarkupType || "percentage");
            setRetailMarkupValue(data.settings.retailMarkupValue?.toString() || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch auto-markup settings:", error);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/auto-markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wholesaleMarkupType,
          wholesaleMarkupValue: parseFloat(wholesaleMarkupValue) || 0,
          resellerMarkupType,
          resellerMarkupValue: parseFloat(resellerMarkupValue) || 0,
          retailMarkupType,
          retailMarkupValue: parseFloat(retailMarkupValue) || 0,
          applyToExisting,
          overrideExisting,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (applyToExisting && data.updatedCount !== undefined) {
          alert(`Settings saved! Applied markups to ${data.updatedCount} products.`);
        } else {
          alert("Auto-markup settings saved successfully!");
        }
        onSave();
        onClose();
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
    setSaving(false);
  };

  // Calculate example prices
  const exampleCost = 1000;
  const calcPrice = (type: string, value: string) => {
    const val = parseFloat(value) || 0;
    if (type === "percentage") {
      return exampleCost + (exampleCost * val / 100);
    }
    return exampleCost + val;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-luxury-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-5xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <div>
            <h3 className="text-lg font-medium text-white">Auto Markup Settings</h3>
            <p className="text-sm text-gray-400 mt-1">Set default markup for new products • Prices auto-calculate when cost price is set</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Three Price Markups in Landscape Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wholesale Markup */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h4 className="text-green-400 font-medium">Wholesale</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Markup Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setWholesaleMarkupType("percentage")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        wholesaleMarkupType === "percentage"
                          ? "bg-green-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setWholesaleMarkupType("fixed")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        wholesaleMarkupType === "fixed"
                          ? "bg-green-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹ Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">
                    {wholesaleMarkupType === "percentage" ? "Markup %" : "Amount ₹"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={wholesaleMarkupValue}
                      onChange={(e) => setWholesaleMarkupValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-center text-lg font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {wholesaleMarkupType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>
              {wholesaleMarkupValue && parseFloat(wholesaleMarkupValue) > 0 && (
                <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-gray-400">
                  ₹{exampleCost.toFixed(2)} →
                  <span className="text-green-400 font-medium ml-1">
                    ₹{calcPrice(wholesaleMarkupType, wholesaleMarkupValue).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Reseller Markup */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h4 className="text-blue-400 font-medium">Reseller</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Markup Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setResellerMarkupType("percentage")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        resellerMarkupType === "percentage"
                          ? "bg-blue-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setResellerMarkupType("fixed")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        resellerMarkupType === "fixed"
                          ? "bg-blue-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹ Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">
                    {resellerMarkupType === "percentage" ? "Markup %" : "Amount ₹"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={resellerMarkupValue}
                      onChange={(e) => setResellerMarkupValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-center text-lg font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {resellerMarkupType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>
              {resellerMarkupValue && parseFloat(resellerMarkupValue) > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-500/20 text-xs text-gray-400">
                  ₹{exampleCost.toFixed(2)} →
                  <span className="text-blue-400 font-medium ml-1">
                    ₹{calcPrice(resellerMarkupType, resellerMarkupValue).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Retail Markup */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <h4 className="text-purple-400 font-medium">Retail</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Markup Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRetailMarkupType("percentage")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        retailMarkupType === "percentage"
                          ? "bg-purple-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setRetailMarkupType("fixed")}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        retailMarkupType === "fixed"
                          ? "bg-purple-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹ Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">
                    {retailMarkupType === "percentage" ? "Markup %" : "Amount ₹"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={retailMarkupValue}
                      onChange={(e) => setRetailMarkupValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-center text-lg font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {retailMarkupType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>
              {retailMarkupValue && parseFloat(retailMarkupValue) > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-gray-400">
                  ₹{exampleCost.toFixed(2)} →
                  <span className="text-purple-400 font-medium ml-1">
                    ₹{calcPrice(retailMarkupType, retailMarkupValue).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Apply to Existing Products */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToExisting}
                  onChange={(e) => {
                    setApplyToExisting(e.target.checked);
                    if (!e.target.checked) setOverrideExisting(false);
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                />
                <span className="text-yellow-400 text-sm font-medium">Apply to existing products</span>
              </label>

              {applyToExisting && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideExisting}
                    onChange={(e) => setOverrideExisting(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-luxury-gray text-red-500 focus:ring-red-500 focus:ring-offset-0"
                  />
                  <span className="text-red-400 text-sm font-medium">Override existing prices</span>
                  <span className="text-gray-500 text-xs">(caution!)</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-luxury-gray">
          <p className="text-xs text-gray-500">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Only applies to products with ₹0 prices (not manually set)
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-luxury-gold text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bulk Markup Tool Modal - Apply to all products
function BulkMarkupToolModal({
  productCount,
  priceType,
  onClose,
  onUpdate,
}: {
  productCount: number;
  priceType: PriceType;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [markupValue, setMarkupValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    if (!markupValue || parseFloat(markupValue) <= 0) {
      alert("Please enter a valid markup value");
      return;
    }

    if (!confirm(`This will update ${priceTypeLabels[priceType].toLowerCase()} for all ${productCount} products. Continue?`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/products/bulk-wholesale-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType,
          markupValue: parseFloat(markupValue),
          priceType,
        }),
      });

      if (!response.ok) throw new Error("Failed to update prices");

      const result = await response.json();
      alert(`Successfully updated ${result.updatedCount} products!`);
      onUpdate();
      onClose();
    } catch (error) {
      alert("Failed to update prices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <h3 className="text-lg font-medium text-white">Bulk Set {priceTypeLabels[priceType]}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Banner */}
          <div className={`rounded-lg p-3 ${
            priceType === "wholesalePrice" ? "bg-green-500/10 border border-green-500/30" :
            priceType === "resellerPrice" ? "bg-blue-500/10 border border-blue-500/30" :
            "bg-purple-500/10 border border-purple-500/30"
          }`}>
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 flex-shrink-0 ${priceTypeColors[priceType]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-sm ${priceTypeColors[priceType]}`}>
                This will set <span className="font-bold">{priceTypeLabels[priceType].toLowerCase()}</span> for <span className="font-bold">{productCount}</span> products based on their individual cost prices.
              </p>
            </div>
          </div>

          {/* Markup Type Toggle */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Markup Type <span className="text-gray-500">(on Cost Price)</span></label>
            <div className="flex gap-2">
              <button
                onClick={() => setMarkupType("percentage")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  markupType === "percentage"
                    ? "bg-luxury-gold text-black"
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setMarkupType("fixed")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  markupType === "fixed"
                    ? "bg-luxury-gold text-black"
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                Fixed Amount (₹)
              </button>
            </div>
          </div>

          {/* Markup Value Input */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              {markupType === "percentage" ? "Markup Percentage" : "Markup Amount"}
            </label>
            <div className="relative">
              <input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                placeholder={markupType === "percentage" ? "e.g., 20" : "e.g., 500"}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                min="0"
                step={markupType === "percentage" ? "0.1" : "1"}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {markupType === "percentage" ? "%" : "₹"}
              </span>
            </div>
          </div>

          {/* Example Calculation */}
          {markupValue && parseFloat(markupValue) > 0 && (
            <div className="bg-luxury-gray/50 rounded-lg p-3 space-y-2">
              <p className="text-gray-400 text-sm font-medium">Example Calculation:</p>
              <div className="text-sm space-y-1">
                <p className="text-gray-300">
                  If Cost Price = ₹1,000
                </p>
                <p className="text-green-400 font-medium">
                  Wholesale Price = {markupType === "percentage"
                    ? `₹1,000 + (₹1,000 × ${markupValue}%) = ₹${(1000 + (1000 * parseFloat(markupValue) / 100)).toFixed(2)}`
                    : `₹1,000 + ₹${parseFloat(markupValue).toFixed(2)} = ₹${(1000 + parseFloat(markupValue)).toFixed(2)}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-400 text-sm">
                This action will overwrite existing {priceTypeLabels[priceType].toLowerCase()}s for all products.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-luxury-gray">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving || !markupValue || parseFloat(markupValue) <= 0}
            className={`px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              priceType === "wholesalePrice" ? "bg-green-600 hover:bg-green-700 text-white" :
              priceType === "resellerPrice" ? "bg-blue-600 hover:bg-blue-700 text-white" :
              "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {saving ? "Applying..." : `Apply to All ${productCount} Products`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Markup Tool Modal
function MarkupToolModal({
  product,
  priceType,
  onClose,
  onUpdate,
}: {
  product: Product;
  priceType: PriceType;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const costPrice = product.costPrice || 0;

  // Get current price based on price type
  const currentPrice = priceType === "wholesalePrice"
    ? (product.wholesalePrice || 0)
    : priceType === "resellerPrice"
    ? (product.resellerPrice || 0)
    : (product.retailPrice || 0);

  // Calculate current markup
  const currentMarkupAmount = currentPrice > 0 && costPrice > 0 ? currentPrice - costPrice : 0;
  const currentMarkupPercentage = costPrice > 0 && currentPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;

  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [markupValue, setMarkupValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Set initial markup value when modal opens
  useEffect(() => {
    if (currentPrice > 0 && costPrice > 0 && currentMarkupPercentage > 0) {
      setMarkupValue(currentMarkupPercentage.toFixed(1));
    }
  }, []);

  // Handle markup type change - convert value between percentage and fixed
  const handleMarkupTypeChange = (newType: "percentage" | "fixed") => {
    if (markupType === newType) return;

    if (markupValue && costPrice > 0) {
      const currentVal = parseFloat(markupValue);
      if (newType === "fixed") {
        // Convert percentage to fixed amount
        const fixedAmount = (costPrice * currentVal) / 100;
        setMarkupValue(fixedAmount.toFixed(0));
      } else {
        // Convert fixed amount to percentage
        const percentage = (currentVal / costPrice) * 100;
        setMarkupValue(percentage.toFixed(1));
      }
    }
    setMarkupType(newType);
  };

  // Calculate price based on markup
  const calculatedPrice = markupValue
    ? markupType === "percentage"
      ? costPrice + (costPrice * parseFloat(markupValue) / 100)
      : costPrice + parseFloat(markupValue)
    : costPrice;

  const handleApply = async () => {
    if (!markupValue || parseFloat(markupValue) <= 0) {
      alert("Please enter a valid markup value");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}/wholesale-price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType,
          markupValue: parseFloat(markupValue),
          priceType,
        }),
      });

      if (!response.ok) throw new Error("Failed to update price");

      onUpdate();
      onClose();
    } catch (error) {
      alert("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <h3 className="text-lg font-medium text-white">Set {priceTypeLabels[priceType]}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-luxury-gray/50 rounded-lg p-3">
            <p className="text-white font-medium truncate">{product.name || "Unnamed Product"}</p>
            <p className="text-gray-400 text-sm">SKU: {product.sku || "-"}</p>
          </div>

          {/* Cost Price Display */}
          <div className="flex justify-between items-center p-3 bg-luxury-gray/30 rounded-lg">
            <span className="text-gray-400">Avg. Cost Price:</span>
            <span className="text-luxury-gold font-medium">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(costPrice)}
            </span>
          </div>

          {/* Current Price & Markup Display */}
          <div className={`p-3 rounded-lg ${
            priceType === "wholesalePrice" ? "bg-green-500/10 border border-green-500/20" :
            priceType === "resellerPrice" ? "bg-blue-500/10 border border-blue-500/20" :
            "bg-purple-500/10 border border-purple-500/20"
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Current {priceTypeLabels[priceType]}:</span>
              <span className={`font-medium ${priceTypeColors[priceType]}`}>
                {currentPrice > 0
                  ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(currentPrice)
                  : <span className="text-gray-500">Not Set</span>
                }
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Current Markup:</span>
              {currentPrice > 0 && currentMarkupAmount > 0 ? (
                <span className="text-white font-medium">
                  <span className="text-yellow-400">{currentMarkupPercentage.toFixed(1)}%</span>
                  <span className="text-gray-400 mx-1">or</span>
                  <span className="text-yellow-400">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(currentMarkupAmount)}</span>
                </span>
              ) : (
                <span className="text-gray-500">No markup applied</span>
              )}
            </div>
          </div>

          {/* Markup Type Toggle */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Markup Type <span className="text-gray-500">(on Cost Price)</span></label>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkupTypeChange("percentage")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  markupType === "percentage"
                    ? "bg-luxury-gold text-black"
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => handleMarkupTypeChange("fixed")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  markupType === "fixed"
                    ? "bg-luxury-gold text-black"
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                Fixed Amount (₹)
              </button>
            </div>
          </div>

          {/* Markup Value Input */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              {markupType === "percentage" ? "Markup Percentage" : "Markup Amount"}
              {currentPrice > 0 && <span className="text-green-400 ml-2">(Pre-filled from current)</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                placeholder={markupType === "percentage" ? "e.g., 20" : "e.g., 500"}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                min="0"
                step={markupType === "percentage" ? "0.1" : "1"}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {markupType === "percentage" ? "%" : "₹"}
              </span>
            </div>
          </div>

          {/* Calculated Price */}
          <div className={`flex justify-between items-center p-4 rounded-lg ${
            priceType === "wholesalePrice" ? "bg-green-500/10 border border-green-500/30" :
            priceType === "resellerPrice" ? "bg-blue-500/10 border border-blue-500/30" :
            "bg-purple-500/10 border border-purple-500/30"
          }`}>
            <span className={`font-medium ${priceTypeColors[priceType]}`}>{priceTypeLabels[priceType]}:</span>
            <span className={`font-bold text-lg ${priceTypeColors[priceType]}`}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(calculatedPrice)}
            </span>
          </div>

          {/* Profit Margin Display */}
          {markupValue && parseFloat(markupValue) > 0 && (
            <div className="text-center text-gray-400 text-sm">
              Markup on Cost: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(calculatedPrice - costPrice)}
              {markupType === "fixed" && costPrice > 0 && (
                <span className="ml-2">
                  ({((calculatedPrice - costPrice) / costPrice * 100).toFixed(1)}%)
                </span>
              )}
              {markupType === "percentage" && (
                <span className="ml-2">
                  ({markupValue}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-luxury-gray">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving || !markupValue || parseFloat(markupValue) <= 0}
            className="px-4 py-2 bg-luxury-gold text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Apply Markup"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Expandable tags component with click to show all
function ExpandableTags({
  items,
  maxVisible = 4,
  bgClass = "bg-luxury-gold/20",
  textClass = "text-luxury-gold",
}: {
  items: string[];
  maxVisible?: number;
  bgClass?: string;
  textClass?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleItems.map((item) => (
        <span
          key={item}
          className={`px-2 py-0.5 ${bgClass} ${textClass} text-xs rounded`}
        >
          {item}
        </span>
      ))}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors cursor-pointer"
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && items.length > maxVisible && (
        <button
          onClick={() => setExpanded(false)}
          className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded hover:bg-gray-500/30 transition-colors cursor-pointer"
        >
          Less
        </button>
      )}
    </div>
  );
}

// Product View Modal
function ProductViewModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium text-white">Product Details</h2>
            {product.sku && (
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                SKU: {product.sku}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Images Gallery */}
            {product.images && product.images.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="aspect-square bg-luxury-gray rounded-lg overflow-hidden relative">
                      <Image src={img} alt={`Product ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Name & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Product Name</h3>
                <p className="text-white font-medium">{product.name || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Category</h3>
                <p className="text-luxury-gold">{product.categoryName || "-"}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              <div className="bg-luxury-gray rounded-lg p-4">
                {product.description ? (
                  <div
                    className="text-white prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-gray-500">No description available</p>
                )}
              </div>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size.id}
                      className="px-3 py-1.5 bg-luxury-gray text-white text-sm rounded-lg"
                    >
                      {size.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Colours */}
            {product.colours && product.colours.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Available Colours</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colours.map((colour, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-sm rounded-lg"
                    >
                      {colour}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            <div className="flex flex-wrap gap-3">
              {product.isFeatured && (
                <span className="px-3 py-1.5 bg-luxury-gold text-black text-sm font-medium rounded-lg">
                  Featured
                </span>
              )}
              {product.isHotSelling && (
                <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg">
                  Hot Selling
                </span>
              )}
              {product.isRecommended && (
                <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg">
                  Recommended
                </span>
              )}
              {product.isNewArrival && (
                <span className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg">
                  New Arrival
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg">
                  Best Seller
                </span>
              )}
            </div>

            {/* Video */}
            {product.video && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Video</h3>
                <div className="bg-luxury-gray rounded-lg p-4">
                  <video
                    src={product.video}
                    controls
                    className="w-full max-h-64 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-luxury-gray">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <Link
            href={`/admin/dashboard/products/edit/${product.id}`}
            className="px-4 py-2 bg-luxury-gold text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Edit Product
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductList() {
  const { products, loading, deleteProduct, toggleStatus, fetchProducts } = useProducts();
  const [filter, setFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [markupProduct, setMarkupProduct] = useState<Product | null>(null);
  const [markupPriceType, setMarkupPriceType] = useState<PriceType>("wholesalePrice");
  const [showBulkMarkup, setShowBulkMarkup] = useState(false);
  const [bulkPriceType, setBulkPriceType] = useState<PriceType>("wholesalePrice");
  const [showAutoMarkupSettings, setShowAutoMarkupSettings] = useState(false);

  // Open markup modal for a specific product and price type - Memoized
  const openMarkupModal = useCallback((product: Product, priceType: PriceType) => {
    setMarkupProduct(product);
    setMarkupPriceType(priceType);
  }, []);

  // Open bulk markup modal for a specific price type - Memoized
  const openBulkMarkupModal = useCallback((priceType: PriceType) => {
    setBulkPriceType(priceType);
    setShowBulkMarkup(true);
  }, []);

  // Handle wholesale price update from markup modal - Memoized
  const handleWholesalePriceUpdate = useCallback(() => {
    // Refresh products list after wholesale price update
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  }, [deleteProduct]);

  const handleToggleStatus = useCallback(async (id: string) => {
    try {
      await toggleStatus(id);
    } catch (error) {
      alert("Failed to update status");
    }
  }, [toggleStatus]);

  const handleClone = async (id: string) => {
    const productToClone = products.find((p) => p.id === id);
    if (!productToClone) return;

    try {
      const clonedProduct = {
        categoryId: productToClone.categoryId,
        brandId: productToClone.brandId,
        name: productToClone.name,
        sku: productToClone.sku ? `${productToClone.sku}-COPY` : "",
        description: productToClone.description,
        images: productToClone.images,
        video: productToClone.video,
        sizeIds: productToClone.sizeIds,
        colours: productToClone.colours,
        isFeatured: productToClone.isFeatured,
        isNewArrival: productToClone.isNewArrival,
        isBestSeller: productToClone.isBestSeller,
        status: "out_of_stock" as const,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clonedProduct),
      });

      if (!response.ok) throw new Error("Failed to clone product");

      window.location.reload();
    } catch (error) {
      alert("Failed to clone product");
    }
  };

  // Memoized formatDate function
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return products.filter((product) => {
      const matchesFilter = filter === "all" || product.status === filter;
      const matchesSearch =
        (product.sku || "").toLowerCase().includes(searchLower) ||
        (product.name || "").toLowerCase().includes(searchLower) ||
        (product.description || "").toLowerCase().includes(searchLower) ||
        (product.categoryName || "").toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  // Memoized status color getter
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "in_stock":
      case "active": // Legacy support
        return "bg-green-500/20 text-green-400";
      case "out_of_stock":
      case "inactive": // Legacy support
      case "draft": // Legacy support
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  }, []);

  // Memoized status label getter
  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "in_stock":
      case "active": // Legacy support
        return "IN STOCK";
      case "out_of_stock":
      case "inactive": // Legacy support
      case "draft": // Legacy support
        return "OUT OF STOCK";
      default:
        return "OUT OF STOCK";
    }
  }, []);

  return (
    <>
      {/* View Modal */}
      {viewingProduct && (
        <ProductViewModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {/* Markup Tool Modal */}
      {markupProduct && (
        <MarkupToolModal
          product={markupProduct}
          priceType={markupPriceType}
          onClose={() => setMarkupProduct(null)}
          onUpdate={handleWholesalePriceUpdate}
        />
      )}

      {/* Bulk Markup Tool Modal */}
      {showBulkMarkup && (
        <BulkMarkupToolModal
          productCount={products.length}
          priceType={bulkPriceType}
          onClose={() => setShowBulkMarkup(false)}
          onUpdate={handleWholesalePriceUpdate}
        />
      )}

      {/* Auto Markup Settings Modal */}
      {showAutoMarkupSettings && (
        <AutoMarkupSettingsModal
          onClose={() => setShowAutoMarkupSettings(false)}
          onSave={() => fetchProducts()}
        />
      )}

      <AdminLayout
        title="Products"
        actions={
          <Link
            href="/admin/dashboard/products/new"
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        }
      >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Products Yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first product.</p>
          <Link
            href="/admin/dashboard/products/new"
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by SKU, name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {([
                  { value: "all", label: "All" },
                  { value: "in_stock", label: "In Stock" },
                  { value: "out_of_stock", label: "Out of Stock" },
                ] as const).map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === item.value
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {/* View Toggle */}
              <div className="flex gap-1 bg-luxury-gray rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-luxury-gold text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-luxury-gold text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {/* Auto Markup Settings Button */}
              <button
                onClick={() => setShowAutoMarkupSettings(true)}
                className="px-3 py-2 bg-luxury-gold hover:bg-yellow-600 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Auto Markup Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Auto Markup
              </button>
              {/* Bulk Markup Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => openBulkMarkupModal("wholesalePrice")}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  title="Bulk set wholesale price"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Wholesale
                </button>
                <button
                  onClick={() => openBulkMarkupModal("resellerPrice")}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  title="Bulk set reseller price"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Reseller
                </button>
                <button
                  onClick={() => openBulkMarkupModal("retailPrice")}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  title="Bulk set retail price"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Retail
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-luxury-gray">
                    {product.images && product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {product.isFeatured && (
                        <span className="px-2 py-1 bg-luxury-gold text-black text-xs font-medium rounded">
                          Featured
                        </span>
                      )}
                      {product.isHotSelling && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                          Hot
                        </span>
                      )}
                      {product.isRecommended && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    {/* Video indicator */}
                    {product.video && (
                      <div className="absolute top-2 right-2">
                        <span className="p-2 bg-black/50 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </span>
                      </div>
                    )}
                    {/* Image count */}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded">
                          +{product.images.length - 1} more
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-3">
                    {/* Product Name */}
                    <h3 className="text-white font-medium truncate">{product.name || "Unnamed Product"}</h3>

                    {/* Category */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{product.categoryName || "No Category"}</span>
                    </div>

                    {/* SKU */}
                    {product.sku && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                          SKU: {product.sku}
                        </span>
                      </div>
                    )}

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                      <ExpandableTags
                        items={product.sizes.map((s) => s.name)}
                        maxVisible={4}
                        bgClass="bg-luxury-gray"
                        textClass="text-gray-300"
                      />
                    )}

                    {/* Colours */}
                    {product.colours && product.colours.length > 0 && (
                      <ExpandableTags
                        items={product.colours}
                        maxVisible={4}
                        bgClass="bg-purple-500/20"
                        textClass="text-purple-400"
                      />
                    )}

                    {/* Stock Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">Stock:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        (product.stockQuantity || 0) > 10
                          ? "bg-green-500/20 text-green-400"
                          : (product.stockQuantity || 0) > 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {product.stockQuantity || 0} units
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-luxury-gray">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          className={`px-3 py-1 text-xs rounded-full ${getStatusColor(product.status)} flex flex-col items-center`}
                        >
                          <span>{getStatusLabel(product.status)}</span>
                          {product.status === "in_stock" && product.stockQuantity > 0 && (
                            <span className="text-[10px] text-green-300 font-medium">Qty: {product.stockQuantity}</span>
                          )}
                        </button>
                        <span className="text-gray-500 text-xs">{formatDate(product.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingProduct(product)}
                          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <Link
                          href={`/admin/dashboard/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleClone(product.id)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Clone"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Products List View */}
          {viewMode === "list" && (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray bg-luxury-gray/50">
                      <th className="text-center px-2 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">IMAGE</th>
                      <th className="text-left px-2 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">PRODUCT</th>
                      <th className="text-right px-2 py-3 text-[10px] font-medium text-orange-400 uppercase tracking-wider whitespace-nowrap">MAXIMUM RETAIL PRICE</th>
                      <th className="text-right px-2 py-3 text-[10px] font-medium text-luxury-gold uppercase tracking-wider whitespace-nowrap">COST PRICE</th>
                      <th className="text-right px-2 py-3 text-[10px] font-medium text-green-400 uppercase tracking-wider whitespace-nowrap">WHOLESALE PRICE</th>
                      <th className="text-right px-2 py-3 text-[10px] font-medium text-blue-400 uppercase tracking-wider whitespace-nowrap">RESELLER PRICE</th>
                      <th className="text-right px-2 py-3 text-[10px] font-medium text-purple-400 uppercase tracking-wider whitespace-nowrap">CUSTOMER PRICE</th>
                      <th className="text-center px-2 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                      <th className="text-center px-2 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-luxury-gray hover:bg-luxury-gray/30 transition-colors align-middle">
                        {/* Image */}
                        <td className="px-3 py-2 text-center align-middle">
                          <div className="relative w-12 h-12 bg-luxury-gray rounded-lg overflow-hidden mx-auto">
                            {product.images && product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt="Product"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {/* Badges overlay */}
                            {(product.isFeatured || product.isHotSelling || product.isRecommended) && (
                              <div className="absolute top-0 left-0 flex gap-0.5">
                                {product.isFeatured && (
                                  <span className="w-2 h-2 bg-luxury-gold rounded-full" title="Featured"></span>
                                )}
                                {product.isHotSelling && (
                                  <span className="w-2 h-2 bg-red-500 rounded-full" title="Hot Selling"></span>
                                )}
                                {product.isRecommended && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full" title="Recommended"></span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Product Details (Name, Category, Sizes, SKU) */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-white font-medium text-sm leading-tight">{product.name || product.sku || "-"}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">{product.categoryName || "No Category"}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-500">{product.brandName || "No Brand"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {product.sku && (
                                <span className="px-1.5 py-0.5 bg-gray-700/50 text-luxury-gold text-[10px] font-mono rounded">
                                  {product.sku}
                                </span>
                              )}
                              {product.sizes && product.sizes.length > 0 && product.sizes.slice(0, 4).map((size) => (
                                <span key={size.id} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded">
                                  {size.name}
                                </span>
                              ))}
                              {product.sizes && product.sizes.length > 4 && (
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded">
                                  +{product.sizes.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* MRP (Maximum Retail Price) */}
                        <td className="px-3 py-2 text-right align-middle">
                          <EditablePrice
                            productId={product.id}
                            field="mrp"
                            value={product.mrp || 0}
                            colorClass="text-orange-400"
                            onUpdate={fetchProducts}
                          />
                        </td>
                        {/* Avg. Cost Price (Landing Price) - NOT EDITABLE */}
                        <td className="px-3 py-2 text-right align-middle">
                          <div className="text-luxury-gold font-medium text-sm">
                            {product.costPrice ? `₹${product.costPrice.toFixed(2)}` : "-"}
                          </div>
                          {product.mrp > 0 && product.costPrice > 0 && (
                            <div className="text-[10px] text-red-400/80">
                              -{((product.mrp - product.costPrice) / product.mrp * 100).toFixed(2)}% | ₹{(product.mrp - product.costPrice).toFixed(2)}
                            </div>
                          )}
                        </td>
                        {/* Wholesale Price */}
                        <td className="px-3 py-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <EditablePrice
                              productId={product.id}
                              field="wholesalePrice"
                              value={product.wholesalePrice || 0}
                              colorClass="text-green-400"
                              onUpdate={fetchProducts}
                            />
                            <button
                              onClick={() => openMarkupModal(product, "wholesalePrice")}
                              className="p-0.5 text-gray-500 hover:text-green-400 rounded transition-colors"
                              title="Set Markup"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            </button>
                          </div>
                          {product.wholesalePrice > 0 && product.costPrice > 0 && (
                            <div className="text-[10px] text-green-400/60">
                              +{((product.wholesalePrice - product.costPrice) / product.costPrice * 100).toFixed(2)}% | ₹{(product.wholesalePrice - product.costPrice).toFixed(2)}
                            </div>
                          )}
                        </td>
                        {/* Reseller Price */}
                        <td className="px-3 py-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <EditablePrice
                              productId={product.id}
                              field="resellerPrice"
                              value={product.resellerPrice || 0}
                              colorClass="text-blue-400"
                              onUpdate={fetchProducts}
                            />
                            <button
                              onClick={() => openMarkupModal(product, "resellerPrice")}
                              className="p-0.5 text-gray-500 hover:text-blue-400 rounded transition-colors"
                              title="Set Markup"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            </button>
                          </div>
                          {product.resellerPrice > 0 && product.costPrice > 0 && (
                            <div className="text-[10px] text-blue-400/60">
                              +{((product.resellerPrice - product.costPrice) / product.costPrice * 100).toFixed(2)}% | ₹{(product.resellerPrice - product.costPrice).toFixed(2)}
                            </div>
                          )}
                        </td>
                        {/* Retail Price */}
                        <td className="px-3 py-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <EditablePrice
                              productId={product.id}
                              field="retailPrice"
                              value={product.retailPrice || 0}
                              colorClass="text-purple-400"
                              onUpdate={fetchProducts}
                            />
                            <button
                              onClick={() => openMarkupModal(product, "retailPrice")}
                              className="p-0.5 text-gray-500 hover:text-purple-400 rounded transition-colors"
                              title="Set Markup"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            </button>
                          </div>
                          {product.retailPrice > 0 && product.costPrice > 0 && (
                            <div className="text-[10px] text-purple-400/60">
                              +{((product.retailPrice - product.costPrice) / product.costPrice * 100).toFixed(2)}% | ₹{(product.retailPrice - product.costPrice).toFixed(2)}
                            </div>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-3 py-2 text-center align-middle">
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            className={`px-2.5 py-1 text-[10px] rounded-full ${getStatusColor(product.status)} inline-flex flex-col items-center leading-tight`}
                          >
                            <span className="font-medium">{getStatusLabel(product.status)}</span>
                            {product.status === "in_stock" && product.stockQuantity > 0 && (
                              <span className="text-green-300/80">{product.stockQuantity} pcs</span>
                            )}
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2 text-center align-middle">
                          <div className="inline-flex items-center bg-luxury-gray/50 rounded-lg p-0.5">
                            <button
                              onClick={() => setViewingProduct(product)}
                              className="p-1 text-gray-400 hover:text-purple-400 hover:bg-luxury-gray rounded transition-colors"
                              title="View"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <Link
                              href={`/admin/dashboard/products/edit/${product.id}`}
                              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleClone(product.id)}
                              className="p-1 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded transition-colors"
                              title="Clone"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-400">
                  In Stock: <span className="text-green-400">{products.filter((p) => p.status === "in_stock").length}</span>
                </span>
                <span className="text-gray-400">
                  Out of Stock: <span className="text-red-400">{products.filter((p) => p.status === "out_of_stock").length}</span>
                </span>
                <span className="text-gray-400">
                  Featured: <span className="text-luxury-gold">{products.filter((p) => p.isFeatured).length}</span>
                </span>
                <span className="text-gray-400">
                  Hot Selling: <span className="text-red-400">{products.filter((p) => p.isHotSelling).length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </AdminLayout>
    </>
  );
}
