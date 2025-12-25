"use client";

/**
 * @fileoverview Wholesaler management hook with CRUD and approval operations
 * @module hooks/entities/useWholesalers
 *
 * Provides standardized CRUD operations for wholesalers using the factory pattern,
 * with additional approval/rejection functionality.
 */

import { useCrudFactory, createApprovalActions, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Wholesaler {
  id: string;
  username: string | null;
  name: string;
  companyName: string | null;
  contactNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gstNumber: string | null;
  status: "active" | "inactive";
  registrationStatus: "pending" | "approved" | "rejected";
  instagramHandle: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
}

// ============== HOOK ==============

export interface UseWholesalersReturn extends Omit<CrudHookReturn<Wholesaler>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  wholesalers: Wholesaler[];
  fetchWholesalers: () => Promise<void>;
  createWholesaler: (data: Partial<Wholesaler>) => Promise<Wholesaler>;
  updateWholesaler: (id: string, data: Partial<Wholesaler>) => Promise<Wholesaler>;
  deleteWholesaler: (id: string) => Promise<void>;
  approveWholesaler: (id: string) => Promise<Wholesaler>;
  rejectWholesaler: (id: string) => Promise<Wholesaler>;
}

/**
 * Hook for managing wholesaler CRUD and approval operations
 *
 * @returns Object with wholesaler state and operations
 *
 * @example
 * const { wholesalers, loading, approveWholesaler, rejectWholesaler } = useWholesalers();
 */
export function useWholesalers(): UseWholesalersReturn {
  const crud = useCrudFactory<Wholesaler>({
    endpoint: ADMIN_API_ENDPOINTS.wholesalers,
    entityName: "Wholesaler",
  });

  // Create approval actions for wholesaler registration
  const { approveItem, rejectItem } = createApprovalActions<Wholesaler>(
    ADMIN_API_ENDPOINTS.wholesalers,
    crud.setItems,
    "Wholesaler"
  );

  return {
    // State (renamed for API compatibility)
    wholesalers: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchWholesalers: crud.fetchItems,
    createWholesaler: crud.createItem,
    updateWholesaler: crud.updateItem,
    deleteWholesaler: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Approval operations
    approveWholesaler: approveItem,
    rejectWholesaler: rejectItem,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
