/**
 * @fileoverview Entity Type Definitions
 * @module types/entities
 *
 * Central type definitions for all domain entities in the admin application.
 * Re-exports from @repo/shared with additional admin-specific types.
 */

// Re-export all types from shared package
export type {
  ActiveStatus,
  ProductStatus,
  OrderStatus,
  BillStatus,
  BaseEntity,
  StatusEntity,
  Size,
  Category,
  Brand,
  ProductSize,
  Product,
  Vendor,
  PurchaseItem,
  PurchaseBill,
  OrderItem,
  OrderBill,
  Reseller,
} from "@repo/shared";

// ============== ADMIN-SPECIFIC TYPES ==============

/**
 * Product with pricing information for admin view
 */
export interface ProductWithPricing {
  id: string;
  name: string | null;
  sku: string;
  mrp: number;
  costPrice: number;
  wholesalePrice: number;
  resellerPrice: number;
  retailPrice: number;
  stockQuantity: number;
  status: "in_stock" | "out_of_stock";
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  images: string[];
  sizes?: { id: string; name: string }[];
}

/**
 * Retailer entity
 */
export interface Retailer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
  categoryIds: string[];
  createdAt: string;
}

/**
 * Wholesaler entity
 */
export interface Wholesaler {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
  categoryIds: string[];
  createdAt: string;
}

/**
 * Markup calculation result
 */
export interface MarkupResult {
  percentage: number;
  amount: number;
}

/**
 * Discount calculation result
 */
export interface DiscountResult {
  percentage: number;
  amount: number;
}

/**
 * User types for multi-tenant authentication
 */
export type UserType = "admin" | "reseller" | "retailer" | "wholesaler";

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  userId: string | null;
}
