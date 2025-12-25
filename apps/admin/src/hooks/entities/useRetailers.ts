"use client";

/**
 * @fileoverview Retailer management hook with CRUD and approval operations
 * @module hooks/entities/useRetailers
 *
 * Provides standardized CRUD operations for retailers using the factory pattern,
 * with additional approval/rejection functionality.
 */

import { useCrudFactory, createApprovalActions, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Retailer {
  id: string;
  username: string | null;
  name: string;
  contactNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  status: "active" | "inactive";
  registrationStatus: "pending" | "approved" | "rejected";
  instagramHandle: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
}

// ============== HOOK ==============

export interface UseRetailersReturn extends Omit<CrudHookReturn<Retailer>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  retailers: Retailer[];
  fetchRetailers: () => Promise<void>;
  createRetailer: (data: Partial<Retailer>) => Promise<Retailer>;
  updateRetailer: (id: string, data: Partial<Retailer>) => Promise<Retailer>;
  deleteRetailer: (id: string) => Promise<void>;
  approveRetailer: (id: string) => Promise<Retailer>;
  rejectRetailer: (id: string) => Promise<Retailer>;
}

/**
 * Hook for managing retailer CRUD and approval operations
 *
 * @returns Object with retailer state and operations
 *
 * @example
 * const { retailers, loading, approveRetailer, rejectRetailer } = useRetailers();
 */
export function useRetailers(): UseRetailersReturn {
  const crud = useCrudFactory<Retailer>({
    endpoint: ADMIN_API_ENDPOINTS.retailers,
    entityName: "Retailer",
  });

  // Create approval actions for retailer registration
  const { approveItem, rejectItem } = createApprovalActions<Retailer>(
    ADMIN_API_ENDPOINTS.retailers,
    crud.setItems,
    "Retailer"
  );

  return {
    // State (renamed for API compatibility)
    retailers: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchRetailers: crud.fetchItems,
    createRetailer: crud.createItem,
    updateRetailer: crud.updateItem,
    deleteRetailer: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Approval operations
    approveRetailer: approveItem,
    rejectRetailer: rejectItem,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
