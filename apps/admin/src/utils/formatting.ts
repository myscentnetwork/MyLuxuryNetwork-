/**
 * @fileoverview Formatting Utilities
 * @module utils/formatting
 *
 * Pure utility functions for formatting values (prices, dates, etc.)
 */

import { CURRENCY } from "@/src/constants";

// ============== PRICE FORMATTING ==============

/**
 * Formats a number as Indian Rupee currency
 *
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatPrice(1500) // "₹1,500"
 * formatPrice(1500.50, { showDecimals: true }) // "₹1,500.50"
 */
export function formatPrice(
  amount: number | null | undefined,
  options: { showDecimals?: boolean; showSymbol?: boolean } = {}
): string {
  const { showDecimals = false, showSymbol = true } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.symbol}0` : "0";
  }

  const formatted = amount.toLocaleString(CURRENCY.locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return showSymbol ? `${CURRENCY.symbol}${formatted}` : formatted;
}

/**
 * Formats a number using Intl.NumberFormat for currency
 *
 * @param amount - The amount to format
 * @returns Formatted currency string using Intl API
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }

  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============== MARKUP/DISCOUNT CALCULATIONS ==============

/**
 * Calculates markup percentage and amount from cost to selling price
 *
 * @param sellingPrice - The selling price
 * @param costPrice - The cost/purchase price
 * @returns Object containing percentage and absolute amount
 *
 * @example
 * calculateMarkup(1500, 1000) // { percentage: 50, amount: 500 }
 */
export function calculateMarkup(
  sellingPrice: number,
  costPrice: number
): { percentage: number; amount: number } {
  if (!costPrice || costPrice <= 0) {
    return { percentage: 0, amount: 0 };
  }

  const amount = sellingPrice - costPrice;
  const percentage = (amount / costPrice) * 100;

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    amount,
  };
}

/**
 * Calculates discount percentage and amount from MRP
 *
 * @param mrp - Maximum Retail Price
 * @param sellingPrice - The selling price
 * @returns Object containing percentage and absolute amount
 *
 * @example
 * calculateDiscount(5000, 3000) // { percentage: 40, amount: 2000 }
 */
export function calculateDiscount(
  mrp: number,
  sellingPrice: number
): { percentage: number; amount: number } {
  if (!mrp || mrp <= 0) {
    return { percentage: 0, amount: 0 };
  }

  const amount = mrp - sellingPrice;
  const percentage = (amount / mrp) * 100;

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    amount,
  };
}

// ============== DATE FORMATTING ==============

/**
 * Formats a date string to locale format
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(CURRENCY.locale, options);
  } catch {
    return "-";
  }
}

/**
 * Formats a date string to include time
 *
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleString(CURRENCY.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

// ============== STRING FORMATTING ==============

/**
 * Truncates a string to a maximum length with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export function truncate(str: string | null | undefined, maxLength: number = 50): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Capitalizes the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts a string to title case
 *
 * @param str - String to convert
 * @returns Title-cased string
 */
export function titleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============== NUMBER FORMATTING ==============

/**
 * Formats a number with thousands separator
 *
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }
  return num.toLocaleString(CURRENCY.locale);
}

/**
 * Formats a percentage value
 *
 * @param value - Percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  return `${value.toFixed(decimals)}%`;
}
