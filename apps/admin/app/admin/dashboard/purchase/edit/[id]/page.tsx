"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useVendors } from "@/src/hooks/entities";
import { useProducts, Product } from "@/src/hooks/entities";

interface PurchaseItem {
  productId: string;
  sku: string;
  productName: string;
  productImage: string;
  quantity: number;
  mrp: number;
  costPrice: number;
  total: number;
}

export default function EditPurchaseBill() {
  const router = useRouter();
  const params = useParams();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [formData, setFormData] = useState({
    billNumber: "",
    date: "",
    time: "",
    vendorId: "",
    vendorName: "",
    items: [] as PurchaseItem[],
    shippingCharges: 0,
    miscellaneous: 0,
    originalBox: 0,
    totalAmount: 0,
    amountPaid: 0,
    balanceAmount: 0,
    paymentMode: "" as "" | "cash" | "bank_transfer" | "upi" | "cheque" | "credit",
    transactionDetails: "",
    status: "pending" as "pending" | "paid" | "cancelled",
  });

  const isLoading = loading || vendorsLoading || productsLoading;

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/purchase-bills/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/admin/dashboard/purchase");
            return;
          }
          throw new Error("Failed to fetch purchase bill");
        }

        const bill = await res.json();
        setFormData({
          billNumber: bill.billNumber,
          date: bill.date,
          time: bill.time || "",
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
          items: bill.items.map((item: any) => ({
            productId: item.productId,
            sku: item.productSku || item.sku || "",
            productName: item.productName,
            productImage: item.productImage || "",
            quantity: item.quantity,
            mrp: item.mrp || 0,
            costPrice: item.costPrice,
            total: item.total,
          })),
          shippingCharges: bill.shippingCharges || 0,
          miscellaneous: bill.miscellaneous || 0,
          originalBox: bill.originalBox || 0,
          totalAmount: bill.totalAmount,
          amountPaid: bill.paidAmount || bill.amountPaid || 0,
          balanceAmount: bill.balanceAmount,
          paymentMode: bill.paymentMode || "",
          transactionDetails: bill.transactionDetails || "",
          status: bill.status,
        });
      } catch (error) {
        console.error("Error fetching bill:", error);
        alert("Failed to load purchase bill");
        router.push("/admin/dashboard/purchase");
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [params.id, router]);

  // Get selected vendor
  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === formData.vendorId);
  }, [vendors, formData.vendorId]);

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    return (
      product.sku?.toLowerCase().includes(search) ||
      product.brandName?.toLowerCase().includes(search) ||
      product.categoryName?.toLowerCase().includes(search)
    );
  });

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      vendorId,
      vendorName: vendor?.name || "",
    });
  };

  const handleAddProduct = (product: Product) => {
    if (formData.items.some((item) => item.productId === product.id)) {
      alert("This product is already added. Please update the quantity instead.");
      setSearchTerm("");
      setShowProductDropdown(false);
      return;
    }

    const newItem: PurchaseItem = {
      productId: product.id,
      sku: product.sku || "",
      productName: product.description || `${product.brandName} - ${product.categoryName}`,
      productImage: product.images?.[0] || "",
      quantity: 1,
      mrp: product.mrp || 0,
      costPrice: 0,
      total: 0,
    };

    const updatedItems = [...formData.items, newItem];
    updateTotals(updatedItems, formData.amountPaid);
    setSearchTerm("");
    setShowProductDropdown(false);
  };

  const handleItemChange = (index: number, field: "quantity" | "mrp" | "costPrice", value: number) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    if (item) {
      item[field] = value;
      item.total = item.quantity * item.costPrice;
      updateTotals(updatedItems, formData.amountPaid);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    updateTotals(updatedItems, formData.amountPaid);
  };

  const updateTotals = (items: PurchaseItem[], amountPaid: number) => {
    // Calculate total from items only (expenses are managed through view page)
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const balanceAmount = totalAmount - amountPaid;
    setFormData((prev) => ({
      ...prev,
      items,
      totalAmount,
      amountPaid,
      balanceAmount,
      status: balanceAmount <= 0 ? "paid" : "pending",
    }));
  };

  const handleAmountPaidChange = (amountPaid: number) => {
    const balanceAmount = formData.totalAmount - amountPaid;
    setFormData((prev) => ({
      ...prev,
      amountPaid,
      balanceAmount,
      status: balanceAmount <= 0 ? "paid" : "pending",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.billNumber.trim()) {
      alert("Please enter invoice number");
      return;
    }

    if (!formData.vendorId) {
      alert("Please select a vendor");
      return;
    }

    if (formData.items.length === 0) {
      alert("Please add at least one product");
      return;
    }

    const hasInvalidItems = formData.items.some((item) => item.quantity <= 0 || item.costPrice <= 0);
    if (hasInvalidItems) {
      alert("Please enter valid quantity and cost price for all items");
      return;
    }

    // Validate payment mode is selected
    if (!formData.paymentMode) {
      alert("Please select a mode of payment");
      return;
    }

    try {
      setSubmitting(true);

      const vendor = vendors.find((v) => v.id === formData.vendorId);

      // Calculate distributed cost per item for saving
      const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);
      const distributedCost = totalItems > 0 ? (formData.shippingCharges + formData.miscellaneous + formData.originalBox) / totalItems : 0;

      const billData = {
        date: formData.date,
        time: formData.time,
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        vendorCategories: vendor?.categoryNames || [],
        items: formData.items.map((item) => ({
          productId: item.productId,
          productSku: item.sku,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          mrp: item.mrp,
          costPrice: item.costPrice,
          distributedCost: distributedCost,
          finalCostPrice: item.costPrice + distributedCost,
          total: item.total,
        })),
        shippingCharges: formData.shippingCharges,
        miscellaneous: formData.miscellaneous,
        originalBox: formData.originalBox,
        totalAmount: formData.totalAmount,
        paidAmount: formData.amountPaid,
        balanceAmount: formData.balanceAmount,
        paymentMode: formData.paymentMode || null,
        transactionDetails: formData.transactionDetails || null,
        status: formData.balanceAmount <= 0 ? "paid" as const : "pending" as const,
      };

      const res = await fetch(`/api/purchase-bills/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update purchase bill");
      }

      router.push("/admin/dashboard/purchase");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update purchase bill");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Purchase Bill">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Purchase Bill"
      actions={
        <Link
          href="/admin/dashboard/purchase"
          className="bg-luxury-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </Link>
      }
    >
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Header - Shows when vendor is selected */}
          {selectedVendor && (
            <div className="bg-gradient-to-r from-luxury-gold/20 to-luxury-gold/5 rounded-xl border border-luxury-gold/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedVendor.name}</h2>
                    <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
                      {selectedVendor.city && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedVendor.city}
                        </span>
                      )}
                      {selectedVendor.phone && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedVendor.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="px-4 py-2 bg-luxury-gold/20 text-luxury-gold text-sm font-mono rounded-lg border border-luxury-gold/30">
                  {formData.billNumber}
                </span>
              </div>
            </div>
          )}

          {/* Bill Details */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 space-y-6">
            <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3">Bill Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  placeholder="Enter invoice number"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} {vendor.city ? `- ${vendor.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 space-y-6">
            <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3">Products</h3>

            {/* Product Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Add More Products</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowProductDropdown(e.target.value.length > 0);
                }}
                onFocus={() => searchTerm.length > 0 && setShowProductDropdown(true)}
                placeholder="Type SKU or product name to search..."
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              />

              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-luxury-gray border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-luxury-gold/20 transition-colors flex items-center gap-3"
                    >
                      {/* Product Image */}
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.description || "Product"}
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
                      {/* Product Info */}
                      <div className="flex-grow min-w-0">
                        <p className="text-white font-medium truncate">{product.description || "No description"}</p>
                        <p className="text-gray-400 text-sm">{product.brandName} - {product.categoryName}</p>
                      </div>
                      {/* SKU Badge */}
                      {product.sku && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded flex-shrink-0">
                          {product.sku}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showProductDropdown && searchTerm.length > 0 && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-luxury-gray border border-gray-600 rounded-lg shadow-xl p-4">
                  <p className="text-gray-400 text-center">No products found</p>
                </div>
              )}
            </div>

            {/* Selected Products Table */}
            {formData.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Image</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">SKU</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Qty</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-orange-400">MRP</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Cost Price</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Total</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-luxury-gray/50">
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
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
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                            {item.sku || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white text-sm">{item.productName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-luxury-gray border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                            placeholder="1"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.mrp || ""}
                            onChange={(e) => handleItemChange(index, "mrp", parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 bg-luxury-gray border border-orange-500/50 rounded text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice || ""}
                              onChange={(e) => handleItemChange(index, "costPrice", parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-luxury-gray border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                              placeholder="0.00"
                            />
                            {item.costPrice > 0 && item.mrp > 0 && item.costPrice < item.mrp && (
                              <div className="mt-1 text-xs">
                                <span className="text-green-400 font-medium">
                                  {((item.mrp - item.costPrice) / item.mrp * 100).toFixed(1)}% off
                                </span>
                                <span className="text-gray-500 ml-1">
                                  (₹{(item.mrp - item.costPrice).toFixed(0)})
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-luxury-gold font-medium">{formatCurrency(item.total)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {formData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No products added yet. Search and select products above.</p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 space-y-6">
            <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3">Payment Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount</label>
                  <div className="px-4 py-3 bg-luxury-gray/50 border border-gray-600 rounded-lg">
                    <p className="text-2xl font-bold text-luxury-gold">{formatCurrency(formData.totalAmount)}</p>
                  </div>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount Paid to Vendor</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amountPaid || ""}
                    onChange={(e) => handleAmountPaidChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Balance Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Balance to Vendor</label>
                  <div className={`px-4 py-3 border rounded-lg ${formData.balanceAmount > 0 ? "bg-red-500/10 border-red-500/50" : "bg-green-500/10 border-green-500/50"}`}>
                    <p className={`text-2xl font-bold ${formData.balanceAmount > 0 ? "text-red-400" : "text-green-400"}`}>
                      {formatCurrency(formData.balanceAmount)}
                    </p>
                  </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-luxury-gray">
              {/* Mode of Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mode of Payment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as typeof formData.paymentMode })}
                  className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                    !formData.paymentMode ? "border-orange-500/50" : "border-gray-600"
                  }`}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit (Pay Later)</option>
                </select>
              </div>

              {/* Transaction Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Details</label>
                <input
                  type="text"
                  value={formData.transactionDetails}
                  onChange={(e) => setFormData({ ...formData, transactionDetails: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  placeholder="Transaction ID / Cheque No / Reference"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Purchase Bill
                </>
              )}
            </button>
            <Link
              href="/admin/dashboard/purchase"
              className="bg-luxury-gray hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
