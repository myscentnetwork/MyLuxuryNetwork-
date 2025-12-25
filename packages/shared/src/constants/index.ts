/**
 * Application Constants
 * Centralized configuration and constant values
 */

// ============== API ENDPOINTS ==============
export const API_ENDPOINTS = {
  // Core entities
  sizes: "/api/sizes",
  categories: "/api/categories",
  brands: "/api/brands",
  products: "/api/products",
  vendors: "/api/vendors",
  resellers: "/api/resellers",

  // Bills
  purchaseBills: "/api/purchase-bills",
  orders: "/api/orders",

  // Utilities
  upload: "/api/upload",
  generateSku: "/api/products/generate-sku",
} as const;

// ============== STATUS OPTIONS ==============
export const ACTIVE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { value: "in_stock", label: "IN STOCK" },
  { value: "out_of_stock", label: "OUT OF STOCK" },
] as const;

export const BILL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// ============== PRODUCT OPTIONS ==============
export const COLOUR_OPTIONS = [
  "Black", "White", "Grey", "Navy", "Brown", "Beige", "Cream",
  "Red", "Blue", "Green", "Yellow", "Orange", "Pink", "Purple",
  "Gold", "Silver", "Rose Gold", "Bronze", "Copper",
  "Burgundy", "Maroon", "Olive", "Teal", "Turquoise",
] as const;

export const TAG_OPTIONS = [
  "Luxury", "Premium", "New Arrival", "Best Seller", "Limited Edition",
  "Exclusive", "Trending", "Sale", "Classic", "Vintage",
  "Designer", "Handmade", "Eco-Friendly", "Unisex", "Gift",
  "Summer Collection", "Winter Collection", "Party Wear", "Casual", "Formal",
] as const;

// ============== UI CONSTANTS ==============
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
} as const;

export const FILE_UPLOAD = {
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  acceptedImageTypes: ["image/png", "image/jpeg", "image/webp"],
  acceptedVideoTypes: ["video/mp4", "video/mov", "video/webm"],
} as const;

// ============== AUTH COOKIES ==============
export const AUTH_COOKIES = {
  admin: "admin_auth",
  reseller: "reseller_auth",
} as const;

// ============== ROUTES ==============
export const ADMIN_ROUTES = {
  dashboard: "/dashboard",
  sizes: "/dashboard/sizes",
  categories: "/dashboard/categories",
  brands: "/dashboard/brands",
  products: "/dashboard/products",
  vendors: "/dashboard/vendors",
  resellers: "/dashboard/resellers",
  purchase: "/dashboard/purchase",
  orders: "/dashboard/orders",
} as const;

export const RESELLER_ROUTES = {
  dashboard: "/dashboard",
  import: "/dashboard/import",
  store: "/dashboard/store",
  settings: "/dashboard/settings",
  support: "/dashboard/support",
} as const;

// ============== CLOUDINARY FOLDERS ==============
export const CLOUDINARY_FOLDERS = {
  brands: "myluxury/brands",
  categories: "myluxury/categories",
  products: "myluxury/products",
  productVideos: "myluxury/products/videos",
  resellers: "myluxury/resellers",
} as const;
