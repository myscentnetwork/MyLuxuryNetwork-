"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { usePurchaseBills } from "@/src/hooks/entities";

interface PurchaseDetail {
  billNumber: string;
  date: string;
  vendorName: string;
  quantity: number;
  costPrice: number;
  finalCostPrice: number;
  total: number;
}

interface InventoryItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  vendorNames: string[];
  totalQuantity: number;
  totalValue: number;
  averageCostPrice: number;
  purchaseCount: number;
  purchaseHistory: PurchaseDetail[];
}

export default function ProductInventory() {
  const { bills, loading } = usePurchaseBills();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "value">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (bills.length === 0) {
      setInventory([]);
      return;
    }

    // Aggregate inventory from all purchase bills (excluding cancelled)
    const inventoryMap = new Map<string, InventoryItem>();

    bills
      .filter((bill) => bill.status !== "cancelled")
      .forEach((bill) => {
        const vendorName = bill.vendorName || "Unknown Vendor";
        bill.items.forEach((item) => {
          const existing = inventoryMap.get(item.productId);
          const sku = item.productSku || "";
          const productImage = item.productImage || "";
          // Use finalCostPrice (includes distributed shipping) for accurate cost calculation
          const itemFinalCostPrice = item.finalCostPrice || item.costPrice;
          const itemTotalValue = item.quantity * itemFinalCostPrice;

          // Create purchase detail entry
          const purchaseDetail: PurchaseDetail = {
            billNumber: bill.billNumber,
            date: bill.date,
            vendorName,
            quantity: item.quantity,
            costPrice: item.costPrice,
            finalCostPrice: itemFinalCostPrice,
            total: itemTotalValue,
          };

          if (existing) {
            existing.totalQuantity += item.quantity;
            existing.totalValue += itemTotalValue;
            existing.purchaseCount += 1;
            // Weighted average: total value / total quantity
            existing.averageCostPrice = existing.totalValue / existing.totalQuantity;
            // Add purchase to history
            existing.purchaseHistory.push(purchaseDetail);
            // Add vendor if not already in list
            if (!existing.vendorNames.includes(vendorName)) {
              existing.vendorNames.push(vendorName);
            }
          } else {
            inventoryMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              productImage,
              sku,
              vendorNames: [vendorName],
              totalQuantity: item.quantity,
              totalValue: itemTotalValue,
              averageCostPrice: itemFinalCostPrice,
              purchaseCount: 1,
              purchaseHistory: [purchaseDetail],
            });
          }
        });
      });

    setInventory(Array.from(inventoryMap.values()));
  }, [bills]);

  const filteredInventory = inventory
    .filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        item.productName.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.vendorNames.some((v) => v.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case "value":
          comparison = a.totalValue - b.totalValue;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);

  const handleSort = (column: "name" | "quantity" | "value") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ column }: { column: "name" | "quantity" | "value" }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Product Inventory">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Product Inventory">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-white">{inventory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Quantity</p>
                <p className="text-2xl font-bold text-white">{totalInventoryQuantity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Inventory Value</p>
                <p className="text-2xl font-bold text-luxury-gold">{formatCurrency(totalInventoryValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {inventory.length === 0 ? (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Inventory Yet</h3>
            <p className="text-gray-400">Inventory will appear here once you add purchase bills.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
              <input
                type="text"
                placeholder="Search by product name, SKU, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              />
            </div>

            {/* Inventory Table */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Image</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Product
                          <SortIcon column="name" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">SKU</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Vendor</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                        <button
                          onClick={() => handleSort("quantity")}
                          className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                        >
                          Quantity
                          <SortIcon column="quantity" />
                        </button>
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Avg. Cost Price</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">
                        <button
                          onClick={() => handleSort("value")}
                          className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                        >
                          Total Value
                          <SortIcon column="value" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.productId} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-14 h-14 bg-gray-700 rounded-lg overflow-hidden">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {item.purchaseCount} purchase{item.purchaseCount !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                            {item.sku || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.vendorNames.map((vendor, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                                {vendor}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-white font-medium text-lg">{item.totalQuantity.toLocaleString()}</span>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="w-6 h-6 bg-luxury-gold/20 hover:bg-luxury-gold/40 text-luxury-gold rounded-full flex items-center justify-center transition-colors"
                              title="View purchase history"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-300">{formatCurrency(item.averageCostPrice)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-luxury-gold font-semibold">{formatCurrency(item.totalValue)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-luxury-gray flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                  Showing {filteredInventory.length} of {inventory.length} products
                </p>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    Total: <span className="text-luxury-gold font-semibold">{formatCurrency(totalInventoryValue)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase History Popup Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-luxury-dark border border-luxury-gray rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-luxury-gray">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                    {selectedItem.productImage ? (
                      <img
                        src={selectedItem.productImage}
                        alt={selectedItem.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedItem.productName}</h3>
                    <p className="text-gray-400 text-sm">{selectedItem.sku}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-luxury-gray/30">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Total Quantity</p>
                  <p className="text-white font-bold text-lg">{selectedItem.totalQuantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Avg. Cost Price</p>
                  <p className="text-luxury-gold font-bold text-lg">{formatCurrency(selectedItem.averageCostPrice)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Total Value</p>
                  <p className="text-green-400 font-bold text-lg">{formatCurrency(selectedItem.totalValue)}</p>
                </div>
              </div>

              {/* Purchase History Table */}
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full">
                  <thead className="bg-luxury-gray/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Bill #</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Vendor</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Base Cost</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Final Cost</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.purchaseHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((purchase, idx) => (
                        <tr key={idx} className="border-b border-luxury-gray/50 hover:bg-luxury-gray/30">
                          <td className="px-4 py-3 text-white text-sm">
                            {new Date(purchase.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-blue-400 text-sm font-mono">{purchase.billNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-purple-300 text-sm">{purchase.vendorName}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">{purchase.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-sm">{formatCurrency(purchase.costPrice)}</td>
                          <td className="px-4 py-3 text-right text-luxury-gold font-medium">{formatCurrency(purchase.finalCostPrice)}</td>
                          <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(purchase.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-luxury-gray bg-luxury-gray/30">
                <p className="text-gray-400 text-sm text-center">
                  {selectedItem.purchaseHistory.length} purchase record{selectedItem.purchaseHistory.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
