"use client";

import { useState, useEffect, useCallback } from "react";

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  total: number;
  productId: string;
  productSku: string;
  productName: string;
  productImage: string | null;
}

export interface OrderReseller {
  id: string;
  name: string;
  shopName: string | null;
  contactNumber: string | null;
  email: string | null;
  storeAddress?: string | null;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string | null;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  status: "pending" | "paid" | "cancelled";
  resellerId: string;
  reseller: OrderReseller;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (data: Partial<Order> & { items: any[] }) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create order");
    }
    const newOrder = await res.json();
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrder = async (id: string, data: Partial<Order>) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update order");
    const updated = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  };

  const deleteOrder = async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete order");
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const updateStatus = async (id: string, status: "pending" | "paid" | "cancelled") => {
    return updateOrder(id, { status });
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    updateStatus,
  };
}
