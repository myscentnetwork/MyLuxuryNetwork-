"use client";

/**
 * @fileoverview Price Display Component
 * @module components/common/PriceDisplay/PriceDisplay
 *
 * Standardized price display with optional markup calculation.
 * Supports multiple price types with consistent formatting.
 */

import React from "react";

// ============== TYPES ==============

export type PriceType = "mrp" | "cost" | "wholesale" | "reseller" | "retail";

export interface PriceDisplayProps {
  /** The price value to display */
  price: number;
  /** Optional cost price for markup calculation */
  costPrice?: number;
  /** Whether to show markup percentage */
  showMarkup?: boolean;
  /** Currency symbol */
  currency?: string;
  /** CSS class for the price value */
  className?: string;
  /** Price type for color coding */
  priceType?: PriceType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show strikethrough (for MRP comparison) */
  strikethrough?: boolean;
}

// ============== CONFIG ==============

const PRICE_TYPE_COLORS: Record<PriceType, string> = {
  mrp: "text-orange-400",
  cost: "text-luxury-gold",
  wholesale: "text-green-400",
  reseller: "text-blue-400",
  retail: "text-purple-400",
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
};

// ============== HELPERS ==============

/**
 * Calculates markup percentage from cost to selling price
 */
export function calculateMarkup(sellingPrice: number, costPrice: number): number {
  if (!costPrice || costPrice <= 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculates markup amount from cost to selling price
 */
export function calculateMarkupAmount(sellingPrice: number, costPrice: number): number {
  if (!costPrice || costPrice <= 0) return 0;
  return sellingPrice - costPrice;
}

/**
 * Formats a number as Indian currency
 */
export function formatPrice(price: number, currency: string = "₹"): string {
  if (price === null || price === undefined || isNaN(price)) return "-";
  return `${currency}${price.toLocaleString("en-IN")}`;
}

// ============== COMPONENT ==============

/**
 * Price Display Component
 *
 * Displays a formatted price with optional markup indicator.
 * Memoized for performance in table contexts.
 *
 * @example
 * <PriceDisplay price={1500} priceType="wholesale" />
 * <PriceDisplay price={1500} costPrice={1000} showMarkup priceType="wholesale" />
 */
export const PriceDisplay = React.memo(function PriceDisplay({
  price,
  costPrice,
  showMarkup = false,
  currency = "₹",
  className = "",
  priceType,
  size = "md",
  strikethrough = false,
}: PriceDisplayProps) {
  const colorClass = priceType ? PRICE_TYPE_COLORS[priceType] : "";
  const sizeClass = SIZE_CLASSES[size];

  // Handle invalid price
  if (price === null || price === undefined || isNaN(price) || price <= 0) {
    return <span className={`${sizeClass} text-gray-500 ${className}`}>-</span>;
  }

  const formattedPrice = formatPrice(price, currency);
  const markup = showMarkup && costPrice ? calculateMarkup(price, costPrice) : null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className={`${sizeClass} ${colorClass} ${strikethrough ? "line-through opacity-60" : ""}`}
      >
        {formattedPrice}
      </span>
      {markup !== null && markup > 0 && (
        <span className="text-xs text-gray-400">
          (+{markup.toFixed(0)}%)
        </span>
      )}
    </span>
  );
});

// ============== COMPOUND COMPONENTS ==============

export interface PriceWithMarkupProps {
  /** Selling price */
  sellingPrice: number;
  /** Cost price for markup calculation */
  costPrice: number;
  /** Currency symbol */
  currency?: string;
  /** CSS class for the container */
  className?: string;
  /** Price type for color coding */
  priceType?: PriceType;
}

/**
 * Price with Markup Display
 *
 * Shows price with markup amount and percentage below it.
 *
 * @example
 * <PriceWithMarkup sellingPrice={1500} costPrice={1000} priceType="wholesale" />
 */
export const PriceWithMarkup = React.memo(function PriceWithMarkup({
  sellingPrice,
  costPrice,
  currency = "₹",
  className = "",
  priceType,
}: PriceWithMarkupProps) {
  const colorClass = priceType ? PRICE_TYPE_COLORS[priceType] : "";
  const markupAmount = calculateMarkupAmount(sellingPrice, costPrice);
  const markupPercent = calculateMarkup(sellingPrice, costPrice);

  if (!sellingPrice || sellingPrice <= 0) {
    return <span className="text-gray-500 text-sm">-</span>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`text-sm font-medium ${colorClass}`}>
        {formatPrice(sellingPrice, currency)}
      </span>
      {costPrice > 0 && markupAmount > 0 && (
        <span className="text-xs text-gray-400">
          +{formatPrice(markupAmount, currency)} ({markupPercent.toFixed(0)}%)
        </span>
      )}
    </div>
  );
});

// ============== PRICE COMPARISON ==============

export interface PriceComparisonProps {
  /** Original price (e.g., MRP) */
  originalPrice: number;
  /** Discounted/selling price */
  sellingPrice: number;
  /** Currency symbol */
  currency?: string;
  /** CSS class for the container */
  className?: string;
}

/**
 * Price Comparison Display
 *
 * Shows original price struck through with selling price and discount.
 *
 * @example
 * <PriceComparison originalPrice={2000} sellingPrice={1500} />
 */
export const PriceComparison = React.memo(function PriceComparison({
  originalPrice,
  sellingPrice,
  currency = "₹",
  className = "",
}: PriceComparisonProps) {
  const discount = originalPrice > 0
    ? ((originalPrice - sellingPrice) / originalPrice) * 100
    : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {originalPrice > sellingPrice && (
        <span className="text-sm text-gray-500 line-through">
          {formatPrice(originalPrice, currency)}
        </span>
      )}
      <span className="text-sm font-medium text-green-400">
        {formatPrice(sellingPrice, currency)}
      </span>
      {discount > 0 && (
        <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
          {discount.toFixed(0)}% off
        </span>
      )}
    </div>
  );
});
