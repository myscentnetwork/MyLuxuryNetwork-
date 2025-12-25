/**
 * @fileoverview Product Service
 * @module services/product/productService
 *
 * Business logic for product-related calculations and operations.
 * Separates business logic from UI components for better testability.
 */

// ============== TYPES ==============

export interface MarkupResult {
  /** Markup percentage */
  percentage: number;
  /** Markup amount */
  amount: number;
}

export interface DiscountResult {
  /** Discount percentage */
  percentage: number;
  /** Discount amount */
  amount: number;
}

export interface PricingValidation {
  isValid: boolean;
  errors: string[];
}

// ============== PRICING CALCULATIONS ==============

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
export function calculateMarkup(sellingPrice: number, costPrice: number): MarkupResult {
  if (costPrice <= 0 || sellingPrice <= 0) {
    return { percentage: 0, amount: 0 };
  }

  const amount = sellingPrice - costPrice;
  const percentage = (amount / costPrice) * 100;

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Calculates discount percentage and amount from MRP to selling price
 *
 * @param mrp - Maximum Retail Price
 * @param sellingPrice - The selling price
 * @returns Object containing percentage and absolute amount
 *
 * @example
 * calculateDiscount(2000, 1500) // { percentage: 25, amount: 500 }
 */
export function calculateDiscount(mrp: number, sellingPrice: number): DiscountResult {
  if (mrp <= 0 || sellingPrice <= 0) {
    return { percentage: 0, amount: 0 };
  }

  const amount = mrp - sellingPrice;
  const percentage = (amount / mrp) * 100;

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Calculates selling price from cost price and markup percentage
 *
 * @param costPrice - The cost/purchase price
 * @param markupPercentage - Markup percentage to apply
 * @returns The calculated selling price
 *
 * @example
 * calculatePriceFromMarkup(1000, 50) // 1500
 */
export function calculatePriceFromMarkup(costPrice: number, markupPercentage: number): number {
  if (costPrice <= 0) return 0;
  return Math.round((costPrice + (costPrice * markupPercentage / 100)) * 100) / 100;
}

/**
 * Calculates selling price from MRP and discount percentage
 *
 * @param mrp - Maximum Retail Price
 * @param discountPercentage - Discount percentage to apply
 * @returns The calculated selling price
 *
 * @example
 * calculatePriceFromDiscount(2000, 25) // 1500
 */
export function calculatePriceFromDiscount(mrp: number, discountPercentage: number): number {
  if (mrp <= 0) return 0;
  return Math.round((mrp - (mrp * discountPercentage / 100)) * 100) / 100;
}

// ============== FORMATTING ==============

/**
 * Formats a price value in INR currency format
 *
 * @param price - The price to format
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @returns Formatted price string
 *
 * @example
 * formatPrice(1500) // "₹1,500"
 * formatPrice(1500, false) // "1,500"
 */
export function formatPrice(price: number, showSymbol = true): string {
  const formatted = price.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats a markup/discount display string
 *
 * @param result - Markup or discount result
 * @param isDiscount - Whether this is a discount (affects sign)
 * @returns Formatted string like "+50% | ₹500" or "-25% | ₹500 off"
 */
export function formatMarkupDisplay(result: MarkupResult | DiscountResult, isDiscount = false): string {
  const sign = isDiscount ? "-" : "+";
  const suffix = isDiscount ? " off" : "";
  return `${sign}${result.percentage.toFixed(0)}% | ₹${result.amount.toLocaleString("en-IN")}${suffix}`;
}

// ============== VALIDATION ==============

/**
 * Validates product pricing data
 *
 * @param pricing - Object containing pricing fields
 * @returns Validation result with errors if any
 */
export function validatePricing(pricing: {
  mrp?: number;
  costPrice?: number;
  wholesalePrice?: number;
  resellerPrice?: number;
  retailPrice?: number;
}): PricingValidation {
  const errors: string[] = [];

  const { mrp = 0, costPrice = 0, wholesalePrice = 0, resellerPrice = 0, retailPrice = 0 } = pricing;

  // Basic validation
  if (costPrice < 0) errors.push("Cost price cannot be negative");
  if (mrp < 0) errors.push("MRP cannot be negative");
  if (wholesalePrice < 0) errors.push("Wholesale price cannot be negative");
  if (resellerPrice < 0) errors.push("Reseller price cannot be negative");
  if (retailPrice < 0) errors.push("Retail price cannot be negative");

  // Business rule validations
  if (mrp > 0 && costPrice > mrp) {
    errors.push("Cost price should not exceed MRP");
  }

  if (wholesalePrice > 0 && wholesalePrice < costPrice) {
    errors.push("Wholesale price should not be less than cost price");
  }

  if (resellerPrice > 0 && resellerPrice < wholesalePrice) {
    errors.push("Reseller price should not be less than wholesale price");
  }

  if (retailPrice > 0 && retailPrice < resellerPrice) {
    errors.push("Retail price should not be less than reseller price");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============== SERVICE OBJECT ==============

/**
 * Product service containing all product-related business logic
 */
export const productService = {
  calculateMarkup,
  calculateDiscount,
  calculatePriceFromMarkup,
  calculatePriceFromDiscount,
  formatPrice,
  formatMarkupDisplay,
  validatePricing,
};
