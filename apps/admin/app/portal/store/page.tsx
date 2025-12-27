"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PortalLayout, { USER_TYPE_CONFIG, UserType } from "@/src/components/layouts/PortalLayout";

interface Product {
  id: string;
  name: string;
  sku: string;
  brandName: string;
  categoryName: string;
  mrp: number;
  retailPrice: number;
  resellerPrice: number;
  wholesalePrice: number;
  status: string;
  images: string[];
  sizes?: { id: string; name: string }[];
  colours?: string[];
}

interface ImportedProduct {
  id: string;
  productId: string;
  sellingPrice: number | null;
  isVisible: boolean;
  product: Product;
}

// Markup Tool Modal for setting selling price
function MarkupToolModal({
  importedProduct,
  costPrice,
  userType,
  onClose,
  onUpdate,
}: {
  importedProduct: ImportedProduct;
  costPrice: number;
  userType: UserType;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const minSellingPrice = importedProduct.product.retailPrice;
  const mrp = importedProduct.product.mrp;

  // Calculate FIXED minimum markup (non-editable base)
  const minMarkupAmount = Math.max(0, minSellingPrice - costPrice);
  const minMarkupPercentage = costPrice > 0 ? (minMarkupAmount / costPrice) * 100 : 0;

  // Calculate maximum ADDITIONAL markup allowed (on top of minimum)
  const maxAdditionalAmount = mrp - minSellingPrice;
  const maxAdditionalPercentage = costPrice > 0 ? (maxAdditionalAmount / costPrice) * 100 : 0;

  // Ensure current price is never below minimum selling price
  const currentPrice = Math.max(importedProduct.sellingPrice || minSellingPrice, minSellingPrice);

  // Calculate current ADDITIONAL markup (above minimum)
  const currentAdditionalAmount = Math.max(0, currentPrice - minSellingPrice);
  const currentAdditionalPercentage = costPrice > 0 ? (currentAdditionalAmount / costPrice) * 100 : 0;

  // Calculate current TOTAL markup (from cost price)
  const currentMarkupAmount = currentPrice - costPrice;
  const currentMarkupPercentage = costPrice > 0 ? (currentMarkupAmount / costPrice) * 100 : 0;

  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  // Additional markup starts at current additional or 0
  const [additionalMarkup, setAdditionalMarkup] = useState<string>(
    currentAdditionalPercentage > 0 ? currentAdditionalPercentage.toFixed(1) : "0"
  );
  const [saving, setSaving] = useState(false);

  const handleMarkupTypeChange = (newType: "percentage" | "fixed") => {
    if (markupType === newType) return;

    if (additionalMarkup && costPrice > 0) {
      const currentVal = parseFloat(additionalMarkup) || 0;
      if (newType === "fixed") {
        // Convert percentage to fixed amount
        const fixedAmount = (costPrice * currentVal) / 100;
        setAdditionalMarkup(fixedAmount.toFixed(0));
      } else {
        // Convert fixed amount to percentage
        const percentage = (currentVal / costPrice) * 100;
        setAdditionalMarkup(percentage.toFixed(1));
      }
    }
    setMarkupType(newType);
  };

  // Calculate total selling price: Cost + Min Markup + Additional Markup
  const additionalAmount = additionalMarkup
    ? markupType === "percentage"
      ? (costPrice * parseFloat(additionalMarkup || "0")) / 100
      : parseFloat(additionalMarkup || "0")
    : 0;

  const calculatedPrice = minSellingPrice + additionalAmount;
  const totalMarkupAmount = minMarkupAmount + additionalAmount;
  const totalMarkupPercentage = costPrice > 0 ? (totalMarkupAmount / costPrice) * 100 : 0;

  const isAboveMRP = calculatedPrice > mrp;
  const isInvalidPrice = isAboveMRP;

  const handleApply = async () => {
    if (isAboveMRP) {
      alert(`Selling price cannot exceed MRP (${formatPrice(mrp)})`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/portal/imported-products/${importedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellingPrice: Math.round(calculatedPrice),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update price");
      }

      onUpdate();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <h3 className="text-lg font-medium text-white">Set My Selling Price</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Landscape Layout */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Product Info & Current Prices */}
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-luxury-gray/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden relative flex-shrink-0">
                    {importedProduct.product.images?.[0] ? (
                      <Image
                        src={importedProduct.product.images[0]}
                        alt={importedProduct.product.sku}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{importedProduct.product.name || "Unnamed Product"}</p>
                    <p className="text-gray-400 text-sm">SKU: {importedProduct.product.sku || "-"}</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="space-y-2 pt-3 border-t border-luxury-gray">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MRP:</span>
                    <span className="text-orange-400 line-through">{formatPrice(importedProduct.product.mrp)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Cost Price:</span>
                    <span className="text-luxury-gold font-medium">{formatPrice(costPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Min Selling:</span>
                    <span className="text-purple-400 font-medium">{formatPrice(minSellingPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Current Selling Price */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-center">
                  <span className="text-gray-400 text-sm block mb-1">My Current Selling Price</span>
                  <span className="font-bold text-xl text-green-400">
                    {currentPrice > 0 ? formatPrice(currentPrice) : <span className="text-gray-500">Not Set</span>}
                  </span>
                  {currentPrice > 0 && currentMarkupAmount > 0 && (
                    <div className="text-sm mt-2 text-gray-400">
                      Markup: <span className="text-yellow-400">{currentMarkupPercentage.toFixed(1)}%</span>
                      <span className="mx-1">|</span>
                      <span className="text-yellow-400">{formatPrice(currentMarkupAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Markup Controls */}
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center p-3 bg-luxury-gold/10 border border-luxury-gold/30 rounded-lg">
                <span className="text-luxury-gold font-semibold text-sm">ADD MARKUP ON YOUR COST PRICE</span>
                <p className="text-gray-400 text-xs mt-1">Cost: {formatPrice(costPrice)}</p>
              </div>

              {/* FIXED Base Markup (Non-editable) */}
              <div className="p-4 bg-purple-500/10 border-2 border-purple-500/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 font-semibold text-sm">BASE MARKUP (FIXED)</span>
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-bold text-purple-400">{minMarkupPercentage.toFixed(1)}%</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-2xl font-bold text-purple-400">{formatPrice(minMarkupAmount)}</span>
                </div>
                <p className="text-gray-500 text-xs text-center mt-2">
                  Required to reach Min Selling Price ({formatPrice(minSellingPrice)})
                </p>
              </div>

              {/* Additional Markup Section */}
              <div className="p-4 bg-luxury-gray/30 border border-luxury-gray rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-luxury-gold font-semibold text-sm">ADD EXTRA MARGIN</span>
                  <span className="text-gray-500 text-xs">Max: {formatPrice(maxAdditionalAmount)}</span>
                </div>

                {/* Markup Type Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleMarkupTypeChange("percentage")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      markupType === "percentage"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => handleMarkupTypeChange("fixed")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      markupType === "fixed"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Fixed (₹)
                  </button>
                </div>

                {/* Additional Markup Input */}
                <div className="relative">
                  <input
                    type="number"
                    value={additionalMarkup}
                    onChange={(e) => setAdditionalMarkup(e.target.value)}
                    placeholder="0"
                    className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                      isInvalidPrice ? 'border-red-500' : 'border-gray-600'
                    }`}
                    min="0"
                    max={markupType === "percentage" ? maxAdditionalPercentage : maxAdditionalAmount}
                    step={markupType === "percentage" ? "0.1" : "1"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    {markupType === "percentage" ? "%" : "₹"}
                  </span>
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <button
                    onClick={() => setAdditionalMarkup("0")}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                      parseFloat(additionalMarkup) === 0
                        ? "bg-gray-600 text-white"
                        : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                    }`}
                  >
                    None
                  </button>
                  {markupType === "percentage" ? (
                    <>
                      {[5, 10, 20].map((val) => {
                        const isValid = val <= maxAdditionalPercentage;
                        return (
                          <button
                            key={val}
                            onClick={() => isValid && setAdditionalMarkup(val.toString())}
                            disabled={!isValid}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              !isValid
                                ? "bg-luxury-gray/50 text-gray-600 cursor-not-allowed"
                                : parseFloat(additionalMarkup) === val
                                ? "bg-luxury-gold text-black"
                                : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                            }`}
                          >
                            +{val}%
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {[100, 200, 500].map((val) => {
                        const isValid = val <= maxAdditionalAmount;
                        return (
                          <button
                            key={val}
                            onClick={() => isValid && setAdditionalMarkup(val.toString())}
                            disabled={!isValid}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              !isValid
                                ? "bg-luxury-gray/50 text-gray-600 cursor-not-allowed"
                                : parseFloat(additionalMarkup) === val
                                ? "bg-luxury-gold text-black"
                                : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                            }`}
                          >
                            +₹{val}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Total Markup Summary */}
              <div className="p-3 bg-luxury-gray/50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Markup:</span>
                  <span className="text-luxury-gold font-semibold">
                    {totalMarkupPercentage.toFixed(1)}% | {formatPrice(totalMarkupAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Result */}
            <div className="space-y-4">
              {/* New Selling Price */}
              <div className={`p-6 rounded-lg text-center ${
                isAboveMRP
                  ? 'bg-red-500/10 border-2 border-red-500/50'
                  : 'bg-green-500/10 border-2 border-green-500/50'
              }`}>
                <span className={`text-sm block mb-2 ${isAboveMRP ? 'text-red-400' : 'text-green-400'}`}>
                  My New Selling Price
                </span>
                <span className={`font-bold text-3xl ${isAboveMRP ? 'text-red-400' : 'text-green-400'}`}>
                  {formatPrice(calculatedPrice)}
                </span>

                {/* Discount from MRP */}
                {!isAboveMRP && mrp > calculatedPrice && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="text-red-400 font-medium">{((mrp - calculatedPrice) / mrp * 100).toFixed(0)}% off MRP</span>
                    <span className="mx-1">|</span>
                    <span className="text-red-400">Save {formatPrice(mrp - calculatedPrice)}</span>
                  </div>
                )}

                {/* Above MRP indicator */}
                {isAboveMRP && (
                  <div className="mt-2 text-sm text-red-400">
                    Exceeds MRP by {formatPrice(calculatedPrice - mrp)}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-lg bg-luxury-gray/30 border border-luxury-gray space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cost Price:</span>
                  <span className="text-white">{formatPrice(costPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">+ Base Markup:</span>
                  <span className="text-purple-400">{formatPrice(minMarkupAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">+ Extra Margin:</span>
                  <span className="text-luxury-gold">{formatPrice(additionalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-luxury-gray">
                  <span className="text-gray-400">= Selling Price:</span>
                  <span className="text-green-400 font-semibold">{formatPrice(calculatedPrice)}</span>
                </div>
              </div>

              {/* Warning when exceeds MRP */}
              {isAboveMRP && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-400 text-sm">Cannot exceed MRP ({formatPrice(mrp)})</span>
                </div>
              )}

              {/* Profit Display */}
              {!isAboveMRP && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-center">
                    <span className="text-gray-400 text-sm block mb-1">Your Profit</span>
                    <span className="font-bold text-2xl text-green-400">{formatPrice(calculatedPrice - costPrice)}</span>
                    <div className="text-sm text-green-400/70 mt-1">
                      ({totalMarkupPercentage.toFixed(1)}% margin on cost)
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleApply}
                  disabled={saving || isAboveMRP}
                  className="w-full px-6 py-3 bg-luxury-gold text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Apply Markup"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-2 bg-luxury-gray text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default Markup Modal for setting markup across all products
function DefaultMarkupModal({
  userType,
  productCount,
  onClose,
  onUpdate,
}: {
  userType: UserType;
  productCount: number;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [markupValue, setMarkupValue] = useState<string>("0");
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load current default markup settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/portal/bulk-markup");
        if (res.ok) {
          const data = await res.json();
          if (data.markupType) {
            setMarkupType(data.markupType);
            setMarkupValue(data.markupValue?.toString() || "0");
          }
        }
      } catch (error) {
        console.error("Failed to fetch markup settings:", error);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleApply = async () => {
    const value = parseFloat(markupValue) || 0;

    if (value < 0) {
      alert("Markup value cannot be negative");
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const response = await fetch("/api/portal/bulk-markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType,
          markupValue: value,
          applyToExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply markup");
      }

      setResult({ success: true, message: data.message });

      if (applyToExisting) {
        onUpdate();
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to apply markup"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gray">
          <h3 className="text-lg font-medium text-white">Set Default Markup for All Products</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Landscape Layout */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-luxury-gold"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Markup Controls */}
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold text-sm">SET EXTRA MARGIN ON ALL PRODUCTS</span>
                  <p className="text-gray-400 text-xs mt-1">Added on top of minimum selling price</p>
                </div>

                {/* Markup Type Toggle */}
                <div className="p-4 bg-luxury-gray/30 border border-luxury-gray rounded-lg">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Margin Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMarkupType("percentage")}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        markupType === "percentage"
                          ? "bg-luxury-gold text-black"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      onClick={() => setMarkupType("fixed")}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        markupType === "fixed"
                          ? "bg-luxury-gold text-black"
                          : "bg-luxury-gray text-gray-400 hover:text-white"
                      }`}
                    >
                      Fixed (₹)
                    </button>
                  </div>
                </div>

                {/* Markup Value Input */}
                <div className="p-4 bg-luxury-gray/30 border border-luxury-gray rounded-lg">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Extra Margin Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={markupValue}
                      onChange={(e) => setMarkupValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-luxury-gray border border-gray-600 rounded-lg text-white text-2xl font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-center"
                      min="0"
                      step={markupType === "percentage" ? "0.1" : "1"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                      {markupType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    <button
                      onClick={() => setMarkupValue("0")}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                        parseFloat(markupValue) === 0
                          ? "bg-gray-600 text-white"
                          : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                      }`}
                    >
                      None
                    </button>
                    {markupType === "percentage" ? (
                      <>
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            key={val}
                            onClick={() => setMarkupValue(val.toString())}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              parseFloat(markupValue) === val
                                ? "bg-luxury-gold text-black"
                                : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                            }`}
                          >
                            +{val}%
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[100, 200, 500, 1000].map((val) => (
                          <button
                            key={val}
                            onClick={() => setMarkupValue(val.toString())}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              parseFloat(markupValue) === val
                                ? "bg-luxury-gold text-black"
                                : "bg-luxury-gray text-gray-400 hover:text-white hover:bg-gray-600"
                            }`}
                          >
                            +₹{val}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Summary & Actions */}
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-400">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-400/80 text-xs">
                        <li>Extra margin is added on top of the minimum selling price</li>
                        <li>Products where markup would exceed MRP will be skipped</li>
                        <li>This setting will be used for all future product imports</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-luxury-gold/10 border border-luxury-gold/30 rounded-lg">
                  <div className="text-center">
                    <span className="text-gray-400 text-sm block mb-2">Your Extra Margin</span>
                    <span className="font-bold text-3xl text-luxury-gold">
                      {markupType === "percentage" ? `${markupValue || 0}%` : `₹${markupValue || 0}`}
                    </span>
                    <p className="text-gray-500 text-xs mt-2">
                      {markupType === "percentage"
                        ? "of cost price added to minimum selling price"
                        : "flat amount added to minimum selling price"
                      }
                    </p>
                  </div>
                </div>

                {/* Apply to Existing Toggle */}
                <div className="p-4 bg-luxury-gray/30 border border-luxury-gray rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToExisting}
                      onChange={(e) => setApplyToExisting(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                    />
                    <div>
                      <span className="text-white font-medium">Apply to existing products</span>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Update all <span className="text-luxury-gold font-semibold">{productCount}</span> products in your catalog
                      </p>
                    </div>
                  </label>
                </div>

                {/* Result Message */}
                {result && (
                  <div className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-sm ${result.success ? "text-green-400" : "text-red-400"}`}>
                        {result.message}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleApply}
                    disabled={saving || loading || result?.success}
                    className="w-full px-6 py-3 bg-luxury-gold text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Applying..." : "Apply Markup"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-2 bg-luxury-gray text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    {result?.success ? "Close" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Product View Modal
function ProductViewModal({
  importedProduct,
  costPrice,
  userType,
  onClose,
}: {
  importedProduct: ImportedProduct;
  costPrice: number;
  userType: UserType;
  onClose: () => void;
}) {
  const product = importedProduct.product;
  // Ensure selling price is never below minimum selling price (retailPrice)
  const sellingPrice = Math.max(importedProduct.sellingPrice || product.retailPrice, product.retailPrice);
  const profit = sellingPrice - costPrice;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-3xl w-full max-h-[90vh] overflow-hidden">
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
                    <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden relative">
                      <Image src={img} alt={`Product ${idx + 1}`} fill className="object-contain" />
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

            {/* Brand */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Brand</h3>
              <p className="text-white">{product.brandName || "-"}</p>
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

            {/* Pricing Summary */}
            <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Pricing Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">MRP:</span>
                  <span className="text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Cost:</span>
                  <span className="text-luxury-gold font-medium">{formatPrice(costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">My Selling Price:</span>
                  <span className="text-green-400 font-medium">{formatPrice(sellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Profit:</span>
                  <span className="text-green-400 font-medium">{formatPrice(profit)}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                product.status === "in_stock"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}>
                {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
              </span>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                importedProduct.isVisible
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}>
                {importedProduct.isVisible ? "Visible in Store" : "Hidden from Store"}
              </span>
            </div>
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
        </div>
      </div>
    </div>
  );
}

export default function PortalStore() {
  const [loading, setLoading] = useState(true);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [userId, setUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [markupProduct, setMarkupProduct] = useState<ImportedProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ImportedProduct | null>(null);
  const [showDefaultMarkup, setShowDefaultMarkup] = useState(false);

  useEffect(() => {
    // Get user info from cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value || "";
      return acc;
    }, {} as Record<string, string>);

    const type = cookies["user_type"] as UserType | undefined;
    const id = cookies["user_id"] || "";

    if (type && ["wholesaler", "reseller", "retailer"].includes(type)) {
      setUserType(type);
    }
    setUserId(id);

    if (id && type) {
      fetchImportedProducts(id, type);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchImportedProducts = async (id: string, type: string) => {
    try {
      let endpoint = "";
      if (type === "reseller") {
        endpoint = `/api/reseller/${id}/products`;
      } else if (type === "wholesaler") {
        endpoint = `/api/wholesaler/${id}/products`;
      } else if (type === "retailer") {
        endpoint = `/api/retailer/${id}/products`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setImportedProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch imported products:", error);
    }
    setLoading(false);
  };

  // Get cost price based on user type
  const getCostPrice = (product: Product) => {
    switch (userType) {
      case "wholesaler":
        return product.wholesalePrice;
      case "reseller":
        return product.resellerPrice || product.wholesalePrice;
      case "retailer":
      default:
        return product.retailPrice;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Toggle visibility
  const toggleVisibility = async (item: ImportedProduct) => {
    try {
      const response = await fetch(`/api/portal/imported-products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVisible: !item.isVisible,
        }),
      });

      if (response.ok) {
        setImportedProducts((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, isVisible: !p.isVisible } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  // Remove product from store
  const removeProduct = async (item: ImportedProduct) => {
    if (!confirm("Are you sure you want to remove this product from your store?")) {
      return;
    }

    try {
      const response = await fetch(`/api/portal/imported-products/${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setImportedProducts((prev) => prev.filter((p) => p.id !== item.id));
      }
    } catch (error) {
      console.error("Failed to remove product:", error);
    }
  };

  const config = USER_TYPE_CONFIG[userType];

  // Filter products based on search query and filter
  const filteredProducts = importedProducts.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "visible" && item.isVisible) ||
      (filter === "hidden" && !item.isVisible);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* Markup Tool Modal */}
      {markupProduct && (
        <MarkupToolModal
          importedProduct={markupProduct}
          costPrice={getCostPrice(markupProduct.product)}
          userType={userType}
          onClose={() => setMarkupProduct(null)}
          onUpdate={() => {
            fetchImportedProducts(userId, userType);
            setMarkupProduct(null);
          }}
        />
      )}

      {/* Product View Modal */}
      {viewingProduct && (
        <ProductViewModal
          importedProduct={viewingProduct}
          costPrice={getCostPrice(viewingProduct.product)}
          userType={userType}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {/* Default Markup Modal */}
      {showDefaultMarkup && (
        <DefaultMarkupModal
          userType={userType}
          productCount={importedProducts.length}
          onClose={() => setShowDefaultMarkup(false)}
          onUpdate={() => {
            fetchImportedProducts(userId, userType);
          }}
        />
      )}

      {importedProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Your Store is Empty</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start by browsing our product catalog and importing products to your store with your desired markup.
          </p>
          <a
            href="/portal/products"
            className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Products
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters - Similar to Admin */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, SKU, brand, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {([
                  { value: "all", label: "All" },
                  { value: "visible", label: "Visible" },
                  { value: "hidden", label: "Hidden" },
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
              {/* Set Default Markup Button */}
              <button
                onClick={() => setShowDefaultMarkup(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                title="Set markup for all products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Default Markup
              </button>
              {/* Import More Button */}
              <a
                href="/portal/products"
                className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Import More
              </a>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((item) => {
                const costPrice = getCostPrice(item.product);
                const retailPrice = item.product.retailPrice;
                // Ensure selling price is never below minimum selling price (retailPrice)
                const sellingPrice = Math.max(item.sellingPrice || retailPrice, retailPrice);
                const profit = sellingPrice - costPrice;
                const profitPercent = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : "0";
                // Discounts from MRP
                const costDiscountAmount = item.product.mrp - costPrice;
                const costDiscountPercent = item.product.mrp > 0 ? ((costDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";
                const retailDiscountAmount = item.product.mrp - retailPrice;
                const retailDiscountPercent = item.product.mrp > 0 ? ((retailDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";
                const sellingDiscountAmount = item.product.mrp - sellingPrice;
                const sellingDiscountPercent = item.product.mrp > 0 ? ((sellingDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";

                return (
                  <div
                    key={item.id}
                    className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-white">
                      {item.product.images && item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt="Product"
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          item.product.status === "in_stock"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}>
                          {item.product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          item.isVisible
                            ? "bg-blue-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}>
                          {item.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      {/* Image count */}
                      {item.product.images && item.product.images.length > 1 && (
                        <div className="absolute bottom-2 right-2">
                          <span className="px-2 py-1 bg-black/50 text-white text-xs rounded">
                            +{item.product.images.length - 1} more
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      {/* Product Name */}
                      <h3 className="text-white font-medium truncate">{item.product.name || item.product.sku}</h3>

                      {/* Category & Brand */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">{item.product.brandName || "No Brand"}</span>
                        {item.product.categoryName && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400">{item.product.categoryName}</span>
                          </>
                        )}
                      </div>

                      {/* SKU */}
                      {item.product.sku && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded inline-block">
                          SKU: {item.product.sku}
                        </span>
                      )}

                      {/* Pricing */}
                      <div className="space-y-2 pt-2 border-t border-luxury-gray">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">MRP:</span>
                          <span className="text-orange-400 line-through">{formatPrice(item.product.mrp)}</span>
                        </div>
                        <div className="flex justify-between text-sm items-start">
                          <span className="text-gray-400">Cost:</span>
                          <div className="text-right">
                            <span className={config.color}>{formatPrice(costPrice)}</span>
                            <span className={`text-xs ml-1 ${costDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>(-{costDiscountPercent}%)</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm items-start">
                          <span className="text-gray-400">Min Sell:</span>
                          <div className="text-right">
                            <span className="text-purple-400">{formatPrice(retailPrice)}</span>
                            <span className={`text-xs ml-1 ${retailDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>(-{retailDiscountPercent}%)</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm items-start">
                          <span className="text-gray-400">My Selling:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setMarkupProduct(item)}
                              className="p-1 text-gray-400 hover:text-luxury-gold hover:bg-luxury-gray rounded transition-colors"
                              title="Add Markup"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <div className="text-right">
                              <span className="text-luxury-gold font-semibold">{formatPrice(sellingPrice)}</span>
                              <span className={`text-xs ml-1 ${sellingDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>(-{sellingDiscountPercent}%)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t border-luxury-gray/50">
                          <span className="text-gray-400">Profit:</span>
                          <span className="text-green-400 font-semibold">{formatPrice(profit)} ({profitPercent}%)</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-luxury-gray">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewingProduct(item)}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-luxury-gray rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setMarkupProduct(item)}
                            className="p-2 text-luxury-gold hover:bg-luxury-gold/20 rounded-lg transition-colors"
                            title="Set Markup"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => toggleVisibility(item)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.isVisible
                                ? "text-blue-400 hover:bg-blue-500/20"
                                : "text-gray-400 hover:bg-gray-500/20"
                            }`}
                            title={item.isVisible ? "Hide" : "Show"}
                          >
                            {item.isVisible ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => removeProduct(item)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray bg-luxury-gray/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Image</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product Details</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-orange-400">MRP</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                        <span className={config.color}>Cost Price</span>
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-purple-400">Min Selling Price</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-luxury-gold">My Selling Price</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-green-400">Your Profit</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((item) => {
                      const costPrice = getCostPrice(item.product);
                      const retailPrice = item.product.retailPrice;
                      // Ensure selling price is never below minimum selling price (retailPrice)
                      const sellingPrice = Math.max(item.sellingPrice || retailPrice, retailPrice);
                      const profit = sellingPrice - costPrice;
                      const profitPercent = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : "0";
                      // Discounts from MRP
                      const costDiscountAmount = item.product.mrp - costPrice;
                      const costDiscountPercent = item.product.mrp > 0 ? ((costDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";
                      const retailDiscountAmount = item.product.mrp - retailPrice;
                      const retailDiscountPercent = item.product.mrp > 0 ? ((retailDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";
                      const sellingDiscountAmount = item.product.mrp - sellingPrice;
                      const sellingDiscountPercent = item.product.mrp > 0 ? ((sellingDiscountAmount / item.product.mrp) * 100).toFixed(0) : "0";

                      return (
                        <tr key={item.id} className="border-b border-luxury-gray hover:bg-luxury-gray/30 transition-colors">
                          {/* Image */}
                          <td className="px-4 py-3">
                            <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden">
                              {item.product.images && item.product.images[0] ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt="Product"
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Product Details */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-white font-medium">{item.product.name || "-"}</p>
                              <p className="text-gray-400 text-xs">{item.product.brandName} • {item.product.categoryName}</p>
                              {item.product.sku && (
                                <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs font-mono rounded inline-block">
                                  {item.product.sku}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* MRP */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-orange-400 line-through text-sm">{formatPrice(item.product.mrp)}</span>
                          </td>

                          {/* Cost Price */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`${config.color} font-medium`}>{formatPrice(costPrice)}</span>
                              <span className={`text-xs ${costDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>-{costDiscountPercent}% off</span>
                            </div>
                          </td>

                          {/* Min Selling Price */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-purple-400">{formatPrice(retailPrice)}</span>
                              <span className={`text-xs ${retailDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>-{retailDiscountPercent}% off</span>
                            </div>
                          </td>

                          {/* My Selling Price */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setMarkupProduct(item)}
                                className="p-1.5 text-gray-400 hover:text-luxury-gold hover:bg-luxury-gray rounded transition-colors"
                                title="Add Markup"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <div className="flex flex-col items-end">
                                <span className="text-luxury-gold font-semibold">{formatPrice(sellingPrice)}</span>
                                <span className={`text-xs ${sellingDiscountAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>-{sellingDiscountPercent}% off</span>
                              </div>
                            </div>
                          </td>

                          {/* Profit */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-green-400 font-semibold">{formatPrice(profit)}</span>
                              <span className="text-xs text-green-400/70">({profitPercent}%)</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${
                                item.product.status === "in_stock"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {item.product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${
                                item.isVisible
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}>
                                {item.isVisible ? "Visible" : "Hidden"}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingProduct(item)}
                                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setMarkupProduct(item)}
                                className="p-2 text-luxury-gold hover:bg-luxury-gold/20 rounded-lg transition-colors"
                                title="Set Markup"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => toggleVisibility(item)}
                                className={`p-2 rounded-lg transition-colors ${
                                  item.isVisible
                                    ? "text-blue-400 hover:bg-blue-500/20"
                                    : "text-gray-400 hover:bg-gray-500/20"
                                }`}
                                title={item.isVisible ? "Hide" : "Show"}
                              >
                                {item.isVisible ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => removeProduct(item)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredProducts.length === 0 && importedProducts.length > 0 && (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-gray-400">No products match your search &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
