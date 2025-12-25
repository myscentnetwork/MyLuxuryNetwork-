"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PortalLayout, { USER_TYPE_CONFIG, UserType } from "@/src/components/layouts/PortalLayout";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productSku: string;
  productName: string;
  productImage: string | null;
}

interface Order {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string | null;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PortalOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [userId, setUserId] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all");

  useEffect(() => {
    // Get user info from cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value || "";
      return acc;
    }, {} as Record<string, string>);

    const type = cookies["user_type"] as UserType | undefined;
    const id = cookies["user_id"] || "";

    if (type && ["wholesaler", "reseller", "retailer"].includes(type)) {
      setUserType(type);
    }
    setUserId(id);

    if (id && type) {
      fetchOrders(id, type);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (id: string, type: string) => {
    try {
      let endpoint = "";
      if (type === "wholesaler") {
        endpoint = `/api/wholesale/orders?wholesalerId=${id}`;
      } else if (type === "reseller") {
        endpoint = `/api/reseller/${id}/orders`;
      } else if (type === "retailer") {
        endpoint = `/api/retail/orders?retailerId=${id}`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
    setLoading(false);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    return true;
  });

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const paidOrders = orders.filter(o => o.status === "paid").length;
  const totalSpent = orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.grandTotal, 0);

  const config = USER_TYPE_CONFIG[userType];

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">My Orders</h2>
          <p className="text-gray-400 text-sm mt-1">
            View and track your order history
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white mt-1">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{paidOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className={`text-2xl font-bold ${config.color} mt-1`}>{formatPrice(totalSpent)}</p>
            </div>
            <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Filter:</span>
          {(["all", "pending", "paid", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? status === "all"
                    ? "bg-luxury-gold text-black"
                    : status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : status === "paid"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                  : "bg-luxury-gray text-gray-400 hover:text-white"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Orders Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Your order history will appear here once you make your first purchase.
          </p>
          <a
            href="/portal/products"
            className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Browse Products
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-luxury-gray/30 transition-colors"
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-white font-medium">{order.invoiceNumber}</p>
                    <p className="text-gray-500 text-sm">{formatDate(order.date)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-gray-400 text-sm">{order.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    order.status === "paid"
                      ? "bg-green-500/20 text-green-400"
                      : order.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className={`font-bold ${config.color}`}>{formatPrice(order.grandTotal)}</p>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedOrder?.id === order.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Order Details */}
              {selectedOrder?.id === order.id && (
                <div className="border-t border-luxury-gray">
                  <div className="p-6">
                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden relative flex-shrink-0">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productSku}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white">{item.productName}</p>
                            <p className="text-gray-500 text-sm font-mono">{item.productSku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">{item.quantity} x {formatPrice(item.unitPrice)}</p>
                            <p className="text-white font-medium">{formatPrice(item.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="border-t border-luxury-gray pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">{formatPrice(order.subtotal)}</span>
                      </div>
                      {order.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Discount</span>
                          <span className="text-green-400">-{formatPrice(order.totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-luxury-gray">
                        <span className="text-white">Total</span>
                        <span className={config.color}>{formatPrice(order.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
