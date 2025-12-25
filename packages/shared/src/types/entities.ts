/**
 * Entity Types for MyLuxuryNetwork
 * Central type definitions for all domain entities
 */

// ============== STATUS TYPES ==============
export type ActiveStatus = "active" | "inactive";
export type ProductStatus = "in_stock" | "out_of_stock";
export type OrderStatus = "pending" | "paid" | "cancelled";
export type BillStatus = "pending" | "paid" | "cancelled";

// ============== BASE ENTITY ==============
export interface BaseEntity {
  id: string;
  createdAt: string;
}

export interface StatusEntity extends BaseEntity {
  status: ActiveStatus;
}

// ============== SIZE ==============
export interface Size extends StatusEntity {
  name: string;
}

// ============== CATEGORY ==============
export interface Category extends StatusEntity {
  name: string;
  logo: string | null;
  sizeIds: string[];
}

// ============== BRAND ==============
export interface Brand extends StatusEntity {
  name: string;
  slug: string;
  logo: string | null;
  categoryIds: string[];
  productCount: number;
}

// ============== PRODUCT ==============
export interface ProductSize {
  id: string;
  name: string;
}

export interface Product extends BaseEntity {
  name: string | null;
  sku: string;
  description: string | null;
  video: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isHotSelling?: boolean;
  isRecommended?: boolean;
  status: ProductStatus;
  categoryId: string;
  brandId: string;
  categoryName: string;
  brandName: string;
  brandLogo?: string | null;
  sizeIds: string[];
  sizes?: ProductSize[];
  images: string[];
  tags: string[];
  colours: string[];
  updatedAt: string;
}

// ============== VENDOR ==============
export interface Vendor extends StatusEntity {
  name: string;
  phone: string | null;
  city: string | null;
  categoryIds: string[];
}

// ============== RESELLER ==============
export interface Reseller extends StatusEntity {
  name: string;
  contactNumber: string | null;
  whatsappNumber: string | null;
  shopName: string | null;
  email: string | null;
  storeAddress: string | null;
  customDomain: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
}

// ============== PURCHASE BILL ==============
export interface PurchaseItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface PurchaseBill extends BaseEntity {
  billNumber: string;
  date: string;
  time: string | null;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  items: PurchaseItem[];
}

// ============== ORDER ==============
export interface OrderItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  discountType: "none" | "percentage" | "amount";
  discountValue: number;
  discountAmount: number;
  total: number;
}

export interface OrderBill extends BaseEntity {
  invoiceNumber: string;
  date: string;
  time: string | null;
  resellerId: string;
  resellerName?: string;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  status: OrderStatus;
  items: OrderItem[];
  updatedAt: string;
}
