"use client";

import { useState, useEffect, useCallback } from "react";

export interface PurchaseItem {
  id?: string;
  productId: string;
  productSku: string;
  productName: string;
  productImage?: string;
  quantity: number;
  costPrice: number;
  finalCostPrice?: number;
  total: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  date: string;
  time: string | null;
  vendorId: string;
  vendorName: string;
  vendorCategories: string[];
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  shippingCharges?: number;
  miscellaneous?: number;
  originalBox?: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

export function usePurchaseBills() {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase-bills");
      if (!res.ok) throw new Error("Failed to fetch purchase bills");
      const data = await res.json();
      setBills(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const createBill = async (data: Partial<PurchaseBill>) => {
    const res = await fetch("/api/purchase-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create purchase bill");
    const newBill = await res.json();
    setBills((prev) => [newBill, ...prev]);
    return newBill;
  };

  const updateBill = async (id: string, data: Partial<PurchaseBill>) => {
    const res = await fetch(`/api/purchase-bills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update purchase bill");
    const updated = await res.json();
    setBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBill = async (id: string) => {
    const res = await fetch(`/api/purchase-bills/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete purchase bill");
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleStatus = async (id: string, newStatus: "pending" | "paid" | "cancelled") => {
    return updateBill(id, { status: newStatus });
  };

  return {
    bills,
    loading,
    error,
    fetchBills,
    createBill,
    updateBill,
    deleteBill,
    toggleStatus,
  };
}
