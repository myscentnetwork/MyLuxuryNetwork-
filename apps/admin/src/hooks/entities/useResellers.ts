"use client";

/**
 * @fileoverview Reseller management hook with CRUD and approval operations
 * @module hooks/entities/useResellers
 *
 * Provides standardized CRUD operations for resellers using the factory pattern,
 * with additional approval/rejection functionality.
 */

import { useCrudFactory, createApprovalActions, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Reseller {
  id: string;
  name: string;
  contactNumber: string | null;
  whatsappNumber: string | null;
  shopName: string | null;
  email: string | null;
  storeAddress: string | null;
  customDomain: string | null;
  status: "active" | "inactive";
  registrationStatus: "pending" | "approved" | "rejected";
  instagramHandle: string | null;
  facebookHandle: string | null;
  youtubeHandle: string | null;
  telegramHandle: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  createdAt: string;
}

// ============== HOOK ==============

export interface UseResellersReturn extends Omit<CrudHookReturn<Reseller>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  resellers: Reseller[];
  fetchResellers: () => Promise<void>;
  createReseller: (data: Partial<Reseller>) => Promise<Reseller>;
  updateReseller: (id: string, data: Partial<Reseller>) => Promise<Reseller>;
  deleteReseller: (id: string) => Promise<void>;
  approveReseller: (id: string) => Promise<Reseller>;
  rejectReseller: (id: string) => Promise<Reseller>;
}

/**
 * Hook for managing reseller CRUD and approval operations
 *
 * @returns Object with reseller state and operations
 *
 * @example
 * const { resellers, loading, approveReseller, rejectReseller } = useResellers();
 */
export function useResellers(): UseResellersReturn {
  const crud = useCrudFactory<Reseller>({
    endpoint: ADMIN_API_ENDPOINTS.resellers,
    entityName: "Reseller",
  });

  // Create approval actions for reseller registration
  const { approveItem, rejectItem } = createApprovalActions<Reseller>(
    ADMIN_API_ENDPOINTS.resellers,
    crud.setItems,
    "Reseller"
  );

  return {
    // State (renamed for API compatibility)
    resellers: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchResellers: crud.fetchItems,
    createReseller: crud.createItem,
    updateReseller: crud.updateItem,
    deleteReseller: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Approval operations
    approveReseller: approveItem,
    rejectReseller: rejectItem,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
