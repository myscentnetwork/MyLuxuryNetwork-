"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import Link from "next/link";
import { Order } from "@/src/hooks/entities";

export default function ViewOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

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
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
      paid: "bg-green-500/20 text-green-500 border-green-500",
      cancelled: "bg-red-500/20 text-red-500 border-red-500",
    };
    return styles[status] || "bg-gray-500/20 text-gray-500 border-gray-500";
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminLayout title="View Order Bill">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading order...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="View Order Bill">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Order Not Found</h3>
          <p className="text-gray-400 mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/admin/dashboard/orders"
            className="inline-block bg-luxury-gold hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="View Order Bill"
      actions={
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-luxury-gray hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
          <Link
            href="/admin/dashboard/orders"
            className="bg-luxury-gray hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to List
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Invoice Header */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{order.invoiceNumber}</h2>
              <p className="text-gray-400">
                {formatDate(order.date)}
                {order.time && ` at ${order.time}`}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getStatusBadge(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Reseller Info */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Reseller Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white font-medium">{order.reseller.name}</p>
            </div>
            {order.reseller.shopName && (
              <div>
                <p className="text-gray-400 text-sm">Shop Name</p>
                <p className="text-white">{order.reseller.shopName}</p>
              </div>
            )}
            {order.reseller.contactNumber && (
              <div>
                <p className="text-gray-400 text-sm">Contact Number</p>
                <p className="text-white">{order.reseller.contactNumber}</p>
              </div>
            )}
            {order.reseller.email && (
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{order.reseller.email}</p>
              </div>
            )}
            {order.reseller.storeAddress && (
              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm">Address</p>
                <p className="text-white">{order.reseller.storeAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray">
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">#</th>
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Product</th>
                  <th className="text-center py-3 px-2 text-gray-400 text-sm font-medium">Qty</th>
                  <th className="text-right py-3 px-2 text-gray-400 text-sm font-medium">Unit Price</th>
                  <th className="text-right py-3 px-2 text-gray-400 text-sm font-medium">Discount</th>
                  <th className="text-right py-3 px-2 text-gray-400 text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-700">
                    <td className="py-3 px-2 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-white">{item.productName}</p>
                          <p className="text-gray-400 text-xs">SKU: {item.productSku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-white">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-white">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-2 text-right">
                      {item.discountAmount > 0 ? (
                        <span className="text-green-400">
                          -{formatCurrency(item.discountAmount)}
                          {item.discountType === "percentage" && (
                            <span className="text-xs ml-1">({item.discountValue}%)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bill Summary</h3>
          <div className="space-y-3 max-w-xs ml-auto">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(order.totalDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-3 flex justify-between text-xl font-bold">
              <span className="text-white">Grand Total</span>
              <span className="text-luxury-gold">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .bg-luxury-dark {
            background: white !important;
            border-color: #ddd !important;
          }
          .text-white,
          .text-gray-300,
          .text-gray-400 {
            color: black !important;
          }
          .text-luxury-gold {
            color: #b8860b !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
