"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import {
  usePurchaseBills,
  useVendors,
  useCategories,
} from "@/src/hooks/entities";

interface VendorStats {
  vendorId: string;
  vendorName: string;
  categories: string[];
  totalPurchaseAmount: number;
  totalExpenses: number;
  totalPaid: number;
  totalBalance: number;
  billCount: number;
}

export default function PurchaseBillList() {
  const { bills, loading: billsLoading, deleteBill } = usePurchaseBills();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { categories, loading: categoriesLoading } = useCategories();
  const [vendorStats, setVendorStats] = useState<VendorStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const loading = billsLoading || vendorsLoading || categoriesLoading;

  useEffect(() => {
    if (bills.length === 0 || vendors.length === 0) return;

    // Calculate vendor stats
    const statsMap = new Map<string, VendorStats>();

    bills.forEach((bill) => {
      if (bill.status === "cancelled") return;

      const existing = statsMap.get(bill.vendorId);
      const vendor = vendors.find((v) => v.id === bill.vendorId);
      const vendorCategories = vendor?.categoryIds
        ?.map((catId) => categories.find((c) => c.id === catId)?.name)
        .filter(Boolean) || [];
      const billExpenses = (bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0);

      if (existing) {
        existing.totalPurchaseAmount += bill.totalAmount || 0;
        existing.totalExpenses += billExpenses;
        existing.totalPaid += bill.paidAmount || 0;
        existing.totalBalance += bill.balanceAmount || 0;
        existing.billCount += 1;
      } else {
        statsMap.set(bill.vendorId, {
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
          categories: vendorCategories as string[],
          totalPurchaseAmount: bill.totalAmount || 0,
          totalExpenses: billExpenses,
          totalPaid: bill.paidAmount || 0,
          totalBalance: bill.balanceAmount || 0,
          billCount: 1,
        });
      }
    });

    setVendorStats(Array.from(statsMap.values()));
  }, [bills, vendors, categories]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase bill?")) {
      try {
        await deleteBill(id);
      } catch (error) {
        alert("Failed to delete purchase bill");
        console.error(error);
      }
    }
  };

  const filteredBills = bills.filter((bill) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(search) ||
      bill.vendorName.toLowerCase().includes(search);
    const matchesVendor = selectedVendorId ? bill.vendorId === selectedVendorId : true;
    return matchesSearch && matchesVendor;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const selectedVendorName = selectedVendorId
    ? vendorStats.find((v) => v.vendorId === selectedVendorId)?.vendorName
    : null;

  if (loading) {
    return (
      <AdminLayout title="Purchase Bills">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Purchase Bills"
      actions={
        <Link
          href="/admin/dashboard/purchase/new"
          className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Purchase Bill
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Vendor Stats Grid */}
        {vendorStats.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Vendor Summary</h3>
              {selectedVendorId && (
                <button
                  onClick={() => setSelectedVendorId(null)}
                  className="text-sm text-luxury-gold hover:text-yellow-400 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorStats.map((stat) => (
                <button
                  key={stat.vendorId}
                  onClick={() => setSelectedVendorId(stat.vendorId === selectedVendorId ? null : stat.vendorId)}
                  className={`bg-luxury-dark rounded-xl border p-5 text-left transition-all hover:border-luxury-gold ${
                    selectedVendorId === stat.vendorId
                      ? "border-luxury-gold ring-2 ring-luxury-gold/30"
                      : "border-luxury-gray"
                  }`}
                >
                  {/* Vendor Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-luxury-gold">
                          {stat.vendorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{stat.vendorName}</h4>
                        <p className="text-gray-500 text-xs">{stat.billCount} bill{stat.billCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    {selectedVendorId === stat.vendorId && (
                      <span className="px-2 py-1 bg-luxury-gold/20 text-luxury-gold text-xs rounded-full">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  {stat.categories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {stat.categories.slice(0, 3).map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            {cat}
                          </span>
                        ))}
                        {stat.categories.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                            +{stat.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-luxury-gray/50">
                    <div>
                      <p className="text-gray-500 text-xs">Amount</p>
                      <p className="text-luxury-gold font-semibold text-sm">{formatCurrency(stat.totalPurchaseAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Expenses</p>
                      <p className="text-blue-400 font-semibold text-sm">{formatCurrency(stat.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total</p>
                      <p className="text-green-400 font-semibold text-sm">{formatCurrency(stat.totalPurchaseAmount + stat.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Balance</p>
                      <p className={`font-semibold text-sm ${stat.totalBalance > 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(stat.totalBalance)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {bills.length === 0 ? (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Purchase Bills Yet</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first purchase bill.</p>
            <Link
              href="/admin/dashboard/purchase/new"
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Purchase Bill
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search & Filter Info */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by bill number or vendor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
                {selectedVendorId && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-luxury-gold/20 border border-luxury-gold/50 rounded-lg">
                    <span className="text-luxury-gold text-sm">
                      Filtered by: <strong>{selectedVendorName}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedVendorId(null)}
                      className="text-luxury-gold hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {/* View Toggle */}
                <div className="flex gap-1 bg-luxury-gray rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "grid"
                        ? "bg-luxury-gold text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title="Grid View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-luxury-gold text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title="List View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBills.length === 0 ? (
                  <div className="col-span-full bg-luxury-dark rounded-xl border border-luxury-gray p-8 text-center">
                    <p className="text-gray-400">No bills found matching your criteria</p>
                  </div>
                ) : (
                  filteredBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors p-4"
                    >
                      {/* Bill Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                          {bill.billNumber}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </div>
                      {/* Vendor */}
                      <h3 className="text-white font-medium mb-1">{bill.vendorName}</h3>
                      <p className="text-gray-400 text-sm mb-3">{formatDate(bill.date)}</p>
                      {/* Amounts */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-gray-500 text-xs">Amount</p>
                          <p className="text-luxury-gold font-medium">{formatCurrency(bill.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Expenses</p>
                          <p className="text-blue-400 font-medium">
                            {formatCurrency((bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total</p>
                          <p className="text-green-400 font-semibold">
                            {formatCurrency(bill.totalAmount + (bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Balance</p>
                          <p className={`font-medium ${(bill.balanceAmount || 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                            {formatCurrency(bill.balanceAmount || 0)}
                          </p>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 pt-3 border-t border-luxury-gray">
                        <Link
                          href={`/admin/dashboard/purchase/view/${bill.id}`}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/dashboard/purchase/edit/${bill.id}`}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* List View (Bills Table) */}
            {viewMode === "list" && (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Bill Number</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Vendor</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Expenses</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Balance</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                          No bills found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium font-mono">{bill.billNumber}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-300">{bill.vendorName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-400">{formatDate(bill.date)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-luxury-gold font-medium">{formatCurrency(bill.totalAmount)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-blue-400 font-medium">
                              {formatCurrency((bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0))}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-green-400 font-semibold">
                              {formatCurrency(bill.totalAmount + (bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0))}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`font-medium ${(bill.balanceAmount || 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                              {formatCurrency(bill.balanceAmount || 0)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(bill.status)}`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/dashboard/purchase/view/${bill.id}`}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="View"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                href={`/admin/dashboard/purchase/edit/${bill.id}`}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDelete(bill.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {/* Summary Footer */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
              <p className="text-gray-400 text-sm">
                Showing {filteredBills.length} of {bills.length} purchase bills
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
