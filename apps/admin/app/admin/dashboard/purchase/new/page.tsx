"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useVendors, useCategories, useSizes } from "@/src/hooks/entities";
import { useProducts, Product } from "@/src/hooks/entities";

interface SizeQuantity {
  sizeId: string;
  sizeName: string;
  quantity: number;
}

interface PurchaseItem {
  productId: string;
  sku: string;
  productName: string;
  productImage: string;
  quantity: number; // Total quantity (sum of all size quantities)
  sizeQuantities: SizeQuantity[]; // Individual size quantities
  mrp: number;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  total: number;
}

export default function AddPurchaseBill() {
  const router = useRouter();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { sizes, loading: sizesLoading } = useSizes();
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [expandedSizeInputs, setExpandedSizeInputs] = useState<Set<number>>(new Set()); // Track which items have expanded size inputs

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    vendorId: "",
    vendorName: "",
    items: [] as PurchaseItem[],
    totalAmount: 0,
    amountPaid: 0,
    balanceAmount: 0,
    paymentMode: "" as "" | "cash" | "bank_transfer" | "upi" | "cheque" | "credit",
    transactionDetails: "",
    status: "pending" as "pending" | "paid" | "cancelled",
  });

  const loading = vendorsLoading || productsLoading || categoriesLoading || sizesLoading;
  const activeVendors = vendors.filter((v) => v.status === "active");

  // Get selected vendor
  const selectedVendor = useMemo(() => {
    return activeVendors.find((v) => v.id === formData.vendorId);
  }, [activeVendors, formData.vendorId]);

  // Get products filtered by vendor's categories
  const vendorProducts = useMemo(() => {
    if (!selectedVendor || selectedVendor.categoryIds.length === 0) {
      return [];
    }
    return products.filter((p) => selectedVendor.categoryIds.includes(p.categoryId));
  }, [products, selectedVendor]);

  // Filter products by search term and selected category
  const filteredProducts = useMemo(() => {
    let filtered = vendorProducts;

    // Filter by selected category
    if (selectedCategoryFilter !== "all") {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((product) =>
        product.sku?.toLowerCase().includes(search) ||
        product.brandName?.toLowerCase().includes(search) ||
        product.categoryName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [vendorProducts, searchTerm, selectedCategoryFilter]);

  const handleVendorChange = (vendorId: string) => {
    const vendor = activeVendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      vendorId,
      vendorName: vendor?.name || "",
      items: [], // Clear items when vendor changes
      totalAmount: 0,
      amountPaid: 0,
      balanceAmount: 0,
    });
    setSelectedCategoryFilter("all");
    setSearchTerm("");
  };

  const handleAddProduct = (product: Product) => {
    // Check if product already exists in items
    if (formData.items.some((item) => item.productId === product.id)) {
      alert("This product is already added. Please update the quantity instead.");
      setSearchTerm("");
      setShowProductDropdown(false);
      return;
    }

    // Get sizes for this product
    // First try product's own sizes, then fall back to category's sizes
    let productSizes = product.sizes || [];

    // If product has no sizes, get sizes from its category
    if (productSizes.length === 0) {
      const productCategory = categories.find(c => c.id === product.categoryId);
      if (productCategory && productCategory.sizeIds && productCategory.sizeIds.length > 0) {
        // Get the actual size objects from the sizes list
        productSizes = sizes
          .filter(s => productCategory.sizeIds.includes(s.id))
          .map(s => ({ id: s.id, name: s.name }));
      }
    }

    // Initialize size quantities from product/category sizes
    const sizeQuantities: SizeQuantity[] = productSizes.map((size) => ({
      sizeId: size.id,
      sizeName: size.name,
      quantity: 0, // Start with 0, user will enter quantity for each size
    }));

    // If product has only one size, set default quantity to 1
    if (sizeQuantities.length === 1 && sizeQuantities[0]) {
      sizeQuantities[0].quantity = 1;
    }

    const newItem: PurchaseItem = {
      productId: product.id,
      sku: product.sku || "",
      productName: product.sku || `${product.brandName} - ${product.categoryName}`,
      productImage: product.images?.[0] || "",
      quantity: sizeQuantities.length === 1 ? 1 : 0, // Total quantity
      sizeQuantities,
      mrp: product.mrp || 0,
      costPrice: product.costPrice || 0,
      wholesalePrice: product.wholesalePrice || 0,
      retailPrice: product.retailPrice || 0,
      total: sizeQuantities.length === 1 ? (product.costPrice || 0) : 0,
    };

    const updatedItems = [...formData.items, newItem];
    updateTotals(updatedItems, formData.amountPaid);
    setSearchTerm("");
    setShowProductDropdown(false);
  };

  const handleItemChange = (index: number, field: "quantity" | "mrp" | "costPrice" | "wholesalePrice" | "retailPrice", value: number) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    if (item) {
      item[field] = value;
      // If quantity changed directly (for single size products), update size quantity too
      if (field === "quantity" && item.sizeQuantities.length === 1 && item.sizeQuantities[0]) {
        item.sizeQuantities[0].quantity = value;
      }
      item.total = item.quantity * item.costPrice;
      updateTotals(updatedItems, formData.amountPaid);
    }
  };

  // Handle size-specific quantity changes
  const handleSizeQuantityChange = (itemIndex: number, sizeIndex: number, quantity: number) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[itemIndex];
    if (item && item.sizeQuantities[sizeIndex]) {
      item.sizeQuantities[sizeIndex].quantity = quantity;
      // Update total quantity as sum of all size quantities
      item.quantity = item.sizeQuantities.reduce((sum, sq) => sum + sq.quantity, 0);
      item.total = item.quantity * item.costPrice;
      updateTotals(updatedItems, formData.amountPaid);
    }
  };

  // Toggle size quantity input expansion
  const toggleSizeInputExpansion = (index: number) => {
    const newExpanded = new Set(expandedSizeInputs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSizeInputs(newExpanded);
  };

  // Save and collapse size inputs
  const saveSizeQuantities = (index: number) => {
    const newExpanded = new Set(expandedSizeInputs);
    newExpanded.delete(index);
    setExpandedSizeInputs(newExpanded);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    updateTotals(updatedItems, formData.amountPaid);
  };

  const updateTotals = (items: PurchaseItem[], amountPaid: number) => {
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const balanceAmount = totalAmount - amountPaid;
    setFormData((prev) => ({
      ...prev,
      items,
      totalAmount,
      amountPaid,
      balanceAmount,
    }));
  };

  const handleAmountPaidChange = (amountPaid: number) => {
    const balanceAmount = formData.totalAmount - amountPaid;
    setFormData((prev) => ({
      ...prev,
      amountPaid,
      balanceAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Validate transaction details for payment modes that require it
    const requiresTransactionDetails = ["bank_transfer", "upi", "cheque"].includes(formData.paymentMode);
    if (requiresTransactionDetails && !formData.transactionDetails.trim()) {
      alert("Transaction details are required for Bank Transfer, UPI, and Cheque payments");
      return;
    }

    try {
      setSubmitting(true);

      const vendor = activeVendors.find((v) => v.id === formData.vendorId);

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
          // Include size-wise quantities for inventory tracking
          sizeQuantities: item.sizeQuantities
            .filter((sq) => sq.quantity > 0) // Only include sizes with quantity > 0
            .map((sq) => ({
              sizeId: sq.sizeId,
              sizeName: sq.sizeName,
              quantity: sq.quantity,
            })),
          mrp: item.mrp,
          costPrice: item.costPrice,
          total: item.total,
        })),
        totalAmount: formData.totalAmount,
        paidAmount: formData.amountPaid,
        balanceAmount: formData.balanceAmount,
        paymentMode: formData.paymentMode || null,
        transactionDetails: formData.transactionDetails || null,
        status: formData.balanceAmount <= 0 ? "paid" as const : "pending" as const,
      };

      const res = await fetch("/api/purchase-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create purchase bill");
      }

      router.push("/admin/dashboard/purchase");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create purchase bill");
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

  return (
    <AdminLayout
      title="Add Purchase Bill"
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
            </div>
          )}

          {/* Bill Details */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-luxury-gray pb-3">
              <h3 className="text-lg font-medium text-white">Bill Details</h3>
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice # will be auto-generated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  disabled={loading}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Select Vendor</option>
                  {activeVendors.map((vendor) => (
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
            <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3">Add Products</h3>

            {/* Vendor Categories Display */}
            {selectedVendor && (
              <div className="bg-luxury-gray/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-300">
                    Vendor Categories ({selectedVendor.categoryNames.length})
                  </h4>
                  <span className="text-xs text-gray-500">
                    {vendorProducts.length} products available
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategoryFilter === "all"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    All ({vendorProducts.length})
                  </button>
                  {selectedVendor.categoryIds.map((catId, idx) => {
                    const catName = selectedVendor.categoryNames[idx];
                    const count = vendorProducts.filter((p) => p.categoryId === catId).length;
                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(catId)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedCategoryFilter === catId
                            ? "bg-luxury-gold text-black"
                            : "bg-luxury-gray text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {catName} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No vendor selected message */}
            {!selectedVendor && (
              <div className="bg-luxury-gray/20 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-400">Select a vendor above to see available products</p>
              </div>
            )}

            {/* Product Search - Similar to orders/new */}
            {selectedVendor && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Product by SKU, Brand or Category</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() => searchTerm.length > 0 && setShowProductDropdown(true)}
                    placeholder="Type to search products..."
                    className="w-full pl-12 pr-10 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setShowProductDropdown(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Product Preview - Shows when typing (similar to orders/new) */}
                {searchTerm.length > 0 && (
                  <div className="mt-3 bg-luxury-dark border border-luxury-gray rounded-xl overflow-hidden">
                    {/* Search results count */}
                    <div className="px-4 py-2 bg-luxury-gray/50 border-b border-gray-700 flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                        {selectedCategoryFilter !== "all" && ` in ${selectedVendor.categoryNames[selectedVendor.categoryIds.indexOf(selectedCategoryFilter)]}`}
                      </p>
                      <p className="text-xs text-gray-500">Click to add</p>
                    </div>
                    {/* Products grid */}
                    <div className="max-h-72 overflow-y-auto p-3">
                      {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {filteredProducts.slice(0, 16).map((product) => {
                            const isAdded = formData.items.some((item) => item.productId === product.id);
                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => !isAdded && handleAddProduct(product)}
                                disabled={isAdded}
                                className={`flex items-start gap-2 p-2 rounded-lg transition-colors text-left border ${
                                  isAdded
                                    ? "bg-green-500/10 border-green-500/50 cursor-not-allowed"
                                    : "border-transparent hover:bg-luxury-gray hover:border-luxury-gold/50"
                                }`}
                              >
                                {/* Product Image */}
                                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700 relative">
                                  {product.images?.[0] ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.sku || "Product"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  {isAdded && (
                                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-luxury-gold text-xs font-mono truncate">{product.sku}</p>
                                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                    <span className="text-white text-xs truncate">{product.brandName}</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-400 text-xs truncate">{product.categoryName}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-400">No products found</p>
                          <p className="text-gray-500 text-sm mt-1">Try different keywords</p>
                        </div>
                      )}
                    </div>
                    {filteredProducts.length > 16 && (
                      <div className="px-4 py-2 text-gray-500 text-sm border-t border-gray-700 text-center bg-luxury-gray/30">
                        +{filteredProducts.length - 16} more products
                      </div>
                    )}
                  </div>
                )}

                {/* Initial hint when empty */}
                {searchTerm.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Type to search by SKU, brand name, or category • {vendorProducts.length} products available
                  </p>
                )}
              </div>
            )}

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
                          <div className="w-12 h-12 bg-luxury-gray rounded-lg overflow-hidden">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          {/* Collapsible size-wise quantity input */}
                          {item.sizeQuantities.length > 1 ? (
                            <div className="space-y-2">
                              {/* Clickable quantity display with size indicator */}
                              <button
                                type="button"
                                onClick={() => toggleSizeInputExpansion(index)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                  expandedSizeInputs.has(index)
                                    ? "bg-luxury-gold/20 border border-luxury-gold text-luxury-gold"
                                    : item.quantity === 0
                                    ? "bg-orange-500/20 border border-orange-500 text-orange-400 hover:bg-orange-500/30"
                                    : "bg-luxury-gray border border-gray-600 text-white hover:border-luxury-gold hover:text-luxury-gold"
                                }`}
                                title={`Click to enter quantity for ${item.sizeQuantities.length} sizes`}
                              >
                                {item.quantity === 0 ? (
                                  <span className="text-xs">Enter Sizes</span>
                                ) : (
                                  <span className="font-medium min-w-[24px]">{item.quantity}</span>
                                )}
                                <svg
                                  className={`w-4 h-4 transition-transform ${expandedSizeInputs.has(index) ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {/* Size count badge */}
                              {!expandedSizeInputs.has(index) && (
                                <p className="text-xs text-gray-500">{item.sizeQuantities.length} sizes available</p>
                              )}

                              {/* Expanded size inputs - Vertical layout */}
                              {expandedSizeInputs.has(index) && (
                                <div className="bg-luxury-gray/30 border border-gray-600 rounded-lg p-3 space-y-2 min-w-[180px]">
                                  <p className="text-xs text-gray-400 font-medium border-b border-gray-600 pb-2">Enter quantity for each size:</p>
                                  <div className="space-y-1.5">
                                    {item.sizeQuantities.map((sq, sizeIdx) => (
                                      <div key={sq.sizeId} className="flex items-center justify-between gap-3 bg-luxury-dark rounded-lg px-3 py-2">
                                        <span className="text-sm text-gray-300 font-medium">{sq.sizeName}</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={sq.quantity || ""}
                                          onChange={(e) => handleSizeQuantityChange(index, sizeIdx, parseInt(e.target.value) || 0)}
                                          className="w-20 px-2 py-1.5 bg-luxury-gray border border-gray-500 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-luxury-gold"
                                          placeholder="0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                                    <div className="text-sm text-gray-400">
                                      Total: <span className="text-luxury-gold font-semibold">{item.quantity}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => saveSizeQuantities(index)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-luxury-gold text-black text-xs font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Done
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || ""}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-luxury-gray border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                              placeholder="1"
                            />
                          )}
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
            <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3">Payment to Vendor</h3>

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
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount Paid</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Balance Amount</label>
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

              {/* Transaction Details - Required only for Bank Transfer, UPI, Cheque */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Details
                  {["bank_transfer", "upi", "cheque"].includes(formData.paymentMode) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {["cash", "credit"].includes(formData.paymentMode) && (
                    <span className="text-gray-500 text-xs font-normal ml-2">(Optional)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.transactionDetails}
                  onChange={(e) => setFormData({ ...formData, transactionDetails: e.target.value })}
                  className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                    ["bank_transfer", "upi", "cheque"].includes(formData.paymentMode)
                      ? "border-orange-500/50"
                      : "border-gray-600"
                  }`}
                  placeholder={
                    formData.paymentMode === "bank_transfer"
                      ? "Enter Bank Transaction ID / NEFT / RTGS Reference"
                      : formData.paymentMode === "upi"
                      ? "Enter UPI Transaction ID"
                      : formData.paymentMode === "cheque"
                      ? "Enter Cheque Number & Bank Name"
                      : "Optional remarks"
                  }
                />
                {["bank_transfer", "upi", "cheque"].includes(formData.paymentMode) && (
                  <p className="text-xs text-orange-400 mt-1">
                    Transaction details are required for {formData.paymentMode === "bank_transfer" ? "Bank Transfer" : formData.paymentMode === "upi" ? "UPI" : "Cheque"} payments
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Purchase Bill
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
