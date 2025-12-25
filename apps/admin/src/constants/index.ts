/**
 * @fileoverview Application Constants
 * @module constants
 *
 * Centralized configuration and constant values for the admin application.
 * Re-exports from @repo/shared with additional admin-specific constants.
 */

// Re-export all constants from shared package
export {
  API_ENDPOINTS,
  ACTIVE_STATUS_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  BILL_STATUS_OPTIONS,
  COLOUR_OPTIONS,
  TAG_OPTIONS,
  PAGINATION,
  FILE_UPLOAD,
  AUTH_COOKIES,
  ADMIN_ROUTES,
  RESELLER_ROUTES,
  CLOUDINARY_FOLDERS,
} from "@repo/shared";

// ============== EXTENDED API ENDPOINTS ==============

/**
 * Extended API endpoints for admin-specific operations
 */
export const ADMIN_API_ENDPOINTS = {
  // Core entities (from shared)
  sizes: "/api/sizes",
  categories: "/api/categories",
  brands: "/api/brands",
  products: "/api/products",
  vendors: "/api/vendors",
  resellers: "/api/resellers",
  retailers: "/api/retailers",
  wholesalers: "/api/wholesalers",

  // Bills
  purchaseBills: "/api/purchase-bills",
  orders: "/api/orders",

  // Product operations
  generateSku: "/api/products/generate-sku",
  syncStock: "/api/products/sync-stock",
  recalculateCosts: "/api/products/recalculate-costs",
  bulkWholesalePrice: "/api/products/bulk-wholesale-price",

  // Statistics
  businessTotals: "/api/stats/business-totals",

  // Authentication
  resellerAuth: "/api/reseller/auth",
  retailAuth: "/api/retail/auth",
  wholesaleAuth: "/api/wholesale/auth",

  // Utilities
  upload: "/api/upload",
} as const;

// ============== PRICE FORMATTING ==============

/**
 * Currency formatting configuration
 */
export const CURRENCY = {
  code: "INR",
  symbol: "₹",
  locale: "en-IN",
} as const;

// ============== APPROVAL STATUS ==============

/**
 * Approval status options for resellers, retailers, wholesalers
 */
export const APPROVAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "text-yellow-400 bg-yellow-400/10" },
  { value: "approved", label: "Approved", color: "text-green-400 bg-green-400/10" },
  { value: "rejected", label: "Rejected", color: "text-red-400 bg-red-400/10" },
] as const;

// ============== AUTH COOKIES (EXTENDED) ==============

/**
 * Extended authentication cookies for all user types
 */
export const AUTH_COOKIE_NAMES = {
  admin: "admin_auth",
  reseller: "reseller_auth",
  retail: "retail_auth",
  wholesale: "wholesale_auth",
} as const;

// ============== TABLE CONFIGURATION ==============

/**
 * Default table configuration
 */
export const TABLE_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  loadingDelay: 200, // ms before showing loader
} as const;

// ============== PRICE COLORS ==============

/**
 * Price type colors for consistent UI
 */
export const PRICE_COLORS = {
  mrp: "text-orange-400",
  costPrice: "text-luxury-gold",
  wholesalePrice: "text-green-400",
  resellerPrice: "text-blue-400",
  retailPrice: "text-purple-400",
} as const;

// ============== STATUS COLORS ==============

/**
 * Status badge colors
 */
export const STATUS_COLORS = {
  active: "text-green-400 bg-green-400/10 border-green-400/20",
  inactive: "text-red-400 bg-red-400/10 border-red-400/20",
  in_stock: "text-green-400 bg-green-400/10 border-green-400/20",
  out_of_stock: "text-red-400 bg-red-400/10 border-red-400/20",
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  approved: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  paid: "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled: "text-gray-400 bg-gray-400/10 border-gray-400/20",
} as const;
