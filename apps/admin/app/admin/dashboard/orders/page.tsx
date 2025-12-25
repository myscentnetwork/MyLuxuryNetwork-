"use client";

import { useState } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import Link from "next/link";
import { useOrders } from "@/src/hooks/entities";

export default function OrdersListPage() {
  const { orders, loading, updateStatus, deleteOrder } = useOrders();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.reseller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.reseller.shopName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const paidOrders = orders.filter((o) => o.status === "paid").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "paid" | "cancelled") => {
    try {
      await updateStatus(orderId, newStatus);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order bill?")) return;
    try {
      await deleteOrder(orderId);
    } catch (error) {
      alert("Failed to delete order");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500",
      paid: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
    };
    return styles[status] || "bg-gray-500/20 text-gray-500";
  };

  return (
    <AdminLayout
      title="List of Generated Bills"
      actions={
        <Link
          href="/admin/dashboard/orders/new"
          className="bg-luxury-gold hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Generate New Bill
        </Link>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Total Bills</p>
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Paid</p>
          <p className="text-2xl font-bold text-green-500">{paidOrders}</p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Cancelled</p>
          <p className="text-2xl font-bold text-red-500">{cancelledOrders}</p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-luxury-gold">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by invoice number, reseller name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "paid", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-luxury-gold text-black"
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 text-center">
          <p className="text-gray-400">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            {orders.length === 0 ? "No Order Bills Generated Yet" : "No Results Found"}
          </h3>
          <p className="text-gray-400 mb-6">
            {orders.length === 0
              ? "Start by generating your first order bill for resellers."
              : "Try adjusting your search or filter criteria."}
          </p>
          {orders.length === 0 && (
            <Link
              href="/admin/dashboard/orders/new"
              className="inline-block bg-luxury-gold hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Generate Order Bill
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray bg-luxury-gray/30">
                  <th className="text-left py-4 px-4 text-gray-400 text-sm font-medium">Invoice</th>
                  <th className="text-left py-4 px-4 text-gray-400 text-sm font-medium">Date</th>
                  <th className="text-left py-4 px-4 text-gray-400 text-sm font-medium">Reseller</th>
                  <th className="text-center py-4 px-4 text-gray-400 text-sm font-medium">Items</th>
                  <th className="text-right py-4 px-4 text-gray-400 text-sm font-medium">Amount</th>
                  <th className="text-center py-4 px-4 text-gray-400 text-sm font-medium">Status</th>
                  <th className="text-center py-4 px-4 text-gray-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-700 hover:bg-luxury-gray/20">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{order.invoiceNumber}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{formatDate(order.date)}</span>
                      {order.time && <span className="text-gray-500 text-sm ml-2">{order.time}</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white">{order.reseller.name}</div>
                      {order.reseller.shopName && (
                        <div className="text-gray-400 text-sm">{order.reseller.shopName}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gray-300">{order.items.length}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-luxury-gold font-medium">{formatCurrency(order.grandTotal)}</span>
                      {order.totalDiscount > 0 && (
                        <div className="text-green-400 text-xs">-{formatCurrency(order.totalDiscount)}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as "pending" | "paid" | "cancelled")
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/dashboard/orders/view/${order.id}`}
                          className="text-blue-400 hover:text-blue-300"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
