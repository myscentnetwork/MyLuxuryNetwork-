"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useProducts,
  useResellers,
  useWholesalers,
  useRetailers,
  useCategories,
  useBrands,
  useSizes,
} from "@/src/hooks/entities";

type UserType = "wholesaler" | "reseller" | "retailer";

interface SizeQuantity {
  sizeId: string;
  sizeName: string;
  quantity: number;
}

interface CombinedUser {
  id: string;
  name: string;
  userType: UserType;
  contactNumber: string | null;
  email: string | null;
  shopName?: string | null;
  companyName?: string | null;
  status: string;
}

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  productSize: string;
  productCategory: string;
  productBrand: string;
  quantity: number;
  sizeQuantities: SizeQuantity[]; // Size-wise quantities
  unitPrice: number;
  discountType: "none" | "percentage" | "amount";
  discountValue: number;
  discountAmount: number;
  total: number;
}

interface QuickProduct {
  sku: string;
  description: string;
  categoryId: string;
  brandId: string;
}

export default function GenerateOrderBillPage() {
  const router = useRouter();
  const { products, createProduct, fetchProducts } = useProducts();
  const { resellers } = useResellers();
  const { wholesalers } = useWholesalers();
  const { retailers } = useRetailers();
  const { categories } = useCategories();
  const { brands } = useBrands();
  const { sizes } = useSizes();

  // Track which items have expanded size inputs
  const [expandedSizeInputs, setExpandedSizeInputs] = useState<Set<string>>(new Set());

  // Combine all users into one list with type information
  const allUsers: CombinedUser[] = [
    ...wholesalers.map((w) => ({
      id: w.id,
      name: w.name,
      userType: "wholesaler" as UserType,
      contactNumber: w.contactNumber,
      email: w.email,
      companyName: w.companyName,
      status: w.status,
    })),
    ...resellers.map((r) => ({
      id: r.id,
      name: r.name,
      userType: "reseller" as UserType,
      contactNumber: r.contactNumber,
      email: r.email,
      shopName: r.shopName,
      status: r.status,
    })),
    ...retailers.map((r) => ({
      id: r.id,
      name: r.name,
      userType: "retailer" as UserType,
      contactNumber: r.contactNumber,
      email: r.email,
      status: r.status,
    })),
  ];

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [billTime, setBillTime] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [items, setItems] = useState<BillItem[]>([
    {
      id: `item-${Date.now()}`,
      productId: "",
      productName: "",
      productSku: "",
      productImage: "",
      productSize: "",
      productCategory: "",
      productBrand: "",
      quantity: 1,
      sizeQuantities: [],
      unitPrice: 0,
      discountType: "none",
      discountValue: 0,
      discountAmount: 0,
      total: 0,
    },
  ]);
  const [saving, setSaving] = useState(false);

  // Quick Add Product Modal
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProduct, setQuickProduct] = useState<QuickProduct>({
    sku: "",
    description: "",
    categoryId: "",
    brandId: "",
  });
  const [addingProduct, setAddingProduct] = useState(false);

  // Product search state - auto-show preview when typing
  const [productSearches, setProductSearches] = useState<Record<string, string>>({});

  // LocalStorage key for bill data persistence
  const BILL_STORAGE_KEY = "orderBillDraft";

  // Load persisted data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(BILL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.billDate) setBillDate(parsed.billDate);
        if (parsed.billTime) setBillTime(parsed.billTime);
        if (parsed.selectedUserId) setSelectedUserId(parsed.selectedUserId);
        if (parsed.selectedUserType) setSelectedUserType(parsed.selectedUserType);
        if (parsed.userSearch) setUserSearch(parsed.userSearch);
        if (parsed.items && parsed.items.length > 0) setItems(parsed.items);
      } catch (e) {
        console.error("Failed to load saved bill data:", e);
      }
    } else {
      // Generate new invoice number only if no saved data
      const now = new Date();
      const dateStr = (now.toISOString().split("T")[0] || "").replace(/-/g, "");
      const timeStr = now.getTime().toString().slice(-4);
      setInvoiceNumber(`INV-${dateStr}-${timeStr}`);
      setBillDate(now.toISOString().split("T")[0] || "");
      setBillTime(now.toTimeString().slice(0, 5));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      invoiceNumber,
      billDate,
      billTime,
      selectedUserId,
      selectedUserType,
      userSearch,
      items,
    };
    localStorage.setItem(BILL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [invoiceNumber, billDate, billTime, selectedUserId, selectedUserType, userSearch, items]);

  // Clear persisted data
  const clearPersistedData = () => {
    localStorage.removeItem(BILL_STORAGE_KEY);
  };

  // Filter users based on search (show all active and inactive)
  const filteredUsers = allUsers.filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.shopName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.companyName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.contactNumber?.includes(userSearch) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Get selected user details
  const selectedUser = allUsers.find((u) => u.id === selectedUserId && u.userType === selectedUserType);

  // Get price based on user type
  const getPriceForUserType = (product: typeof products[0], userType: UserType | null = selectedUserType) => {
    switch (userType) {
      case "wholesaler":
        return product.wholesalePrice || 0;
      case "reseller":
        return product.resellerPrice || 0;
      case "retailer":
        return product.retailPrice || 0;
      default:
        return 0;
    }
  };

  // Dynamically update prices when user type changes
  useEffect(() => {
    if (selectedUserType && items.some(item => item.productId)) {
      setItems(prevItems =>
        prevItems.map(item => {
          if (!item.productId) return item;

          // Find the product to get the new price
          const product = products.find(p => p.id === item.productId);
          if (!product) return item;

          const newUnitPrice = getPriceForUserType(product, selectedUserType);
          const subtotal = item.quantity * newUnitPrice;

          let discountAmount = 0;
          if (item.discountType === "percentage") {
            discountAmount = (subtotal * item.discountValue) / 100;
          } else if (item.discountType === "amount") {
            discountAmount = item.discountValue;
          }

          return {
            ...item,
            unitPrice: newUnitPrice,
            discountAmount,
            total: Math.max(0, subtotal - discountAmount),
          };
        })
      );
    }
  }, [selectedUserType, products]);

  // Filter products based on search and user type (only show products with price set for selected user type)
  const getFilteredProducts = (itemId: string) => {
    const search = productSearches[itemId] || "";
    return products.filter((p) => {
      // Check if product has price for selected user type
      const hasValidPrice = (() => {
        if (!selectedUserType) return true; // Show all if no user selected
        switch (selectedUserType) {
          case "wholesaler":
            return p.wholesalePrice && p.wholesalePrice > 0;
          case "reseller":
            return p.resellerPrice && p.resellerPrice > 0;
          case "retailer":
            return p.retailPrice && p.retailPrice > 0;
          default:
            return true;
        }
      })();

      if (!hasValidPrice) return false;

      // Then apply search filter
      return (
        !search ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(search.toLowerCase())
      );
    });
  };

  // Add new item row
  const addItem = () => {
    const newItem: BillItem = {
      id: `item-${Date.now()}`,
      productId: "",
      productName: "",
      productSku: "",
      productImage: "",
      productSize: "",
      productCategory: "",
      productBrand: "",
      quantity: 1,
      sizeQuantities: [],
      unitPrice: 0,
      discountType: "none",
      discountValue: 0,
      discountAmount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove item row
  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
    const newSearches = { ...productSearches };
    delete newSearches[itemId];
    setProductSearches(newSearches);
  };

  // Update item
  const updateItem = (itemId: string, updates: Partial<BillItem>) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, ...updates };

        // Recalculate discount and total
        const subtotal = updated.quantity * updated.unitPrice;
        if (updated.discountType === "percentage") {
          updated.discountAmount = (subtotal * updated.discountValue) / 100;
        } else if (updated.discountType === "amount") {
          updated.discountAmount = updated.discountValue;
        } else {
          updated.discountAmount = 0;
        }
        updated.total = Math.max(0, subtotal - updated.discountAmount);

        return updated;
      })
    );
  };

  // Select product for an item
  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const unitPrice = getPriceForUserType(product);

      // Get sizes for this product - first from product, then from category
      let productSizes = product.sizes || [];
      if (productSizes.length === 0) {
        const productCategory = categories.find(c => c.id === product.categoryId);
        if (productCategory && productCategory.sizeIds && productCategory.sizeIds.length > 0) {
          productSizes = sizes
            .filter(s => productCategory.sizeIds.includes(s.id))
            .map(s => ({ id: s.id, name: s.name }));
        }
      }

      // Initialize size quantities
      const sizeQuantities: SizeQuantity[] = productSizes.map((size) => ({
        sizeId: size.id,
        sizeName: size.name,
        quantity: 0,
      }));

      // Get sizes as comma-separated string for display
      const sizeNames = productSizes.map(s => s.name).join(", ") || "";

      updateItem(itemId, {
        productId: product.id,
        productName: product.name || product.sku,
        productSku: product.sku,
        productImage: product.images?.[0] || "",
        productSize: sizeNames,
        productCategory: product.categoryName || "",
        productBrand: product.brandName || "",
        unitPrice: unitPrice,
        sizeQuantities: sizeQuantities,
        quantity: sizeQuantities.length > 1 ? 0 : 1, // Reset quantity if multiple sizes
      });
      setProductSearches({ ...productSearches, [itemId]: "" });
    }
  };

  // Toggle size input expansion
  const toggleSizeInputExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedSizeInputs);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedSizeInputs(newExpanded);
  };

  // Handle size quantity change
  const handleSizeQuantityChange = (itemId: string, sizeIndex: number, quantity: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== itemId) return item;

        const newSizeQuantities = [...item.sizeQuantities];
        if (newSizeQuantities[sizeIndex]) {
          newSizeQuantities[sizeIndex] = { ...newSizeQuantities[sizeIndex], quantity };
        }

        // Update total quantity as sum of all size quantities
        const totalQuantity = newSizeQuantities.reduce((sum, sq) => sum + sq.quantity, 0);

        // Recalculate totals
        const subtotal = totalQuantity * item.unitPrice;
        let discountAmount = 0;
        if (item.discountType === "percentage") {
          discountAmount = (subtotal * item.discountValue) / 100;
        } else if (item.discountType === "amount") {
          discountAmount = item.discountValue;
        }

        return {
          ...item,
          sizeQuantities: newSizeQuantities,
          quantity: totalQuantity,
          discountAmount,
          total: Math.max(0, subtotal - discountAmount),
        };
      })
    );
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  // Quick add product handler
  const handleQuickAddProduct = async () => {
    if (!quickProduct.sku || !quickProduct.categoryId || !quickProduct.brandId) {
      alert("Please fill in SKU, Category, and Brand");
      return;
    }

    setAddingProduct(true);
    try {
      await createProduct({
        sku: quickProduct.sku,
        description: quickProduct.description || quickProduct.sku,
        categoryId: quickProduct.categoryId,
        brandId: quickProduct.brandId,
        status: "in_stock",
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
        sizeIds: [],
        images: [],
        tags: [],
        colours: [],
      });
      await fetchProducts();
      setQuickProduct({ sku: "", description: "", categoryId: "", brandId: "" });
      setShowQuickAddProduct(false);
      alert("Product added successfully!");
    } catch (error) {
      alert("Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  };

  // Save bill
  const handleSave = async () => {
    if (!selectedUserId || !selectedUserType) {
      alert("Please select a user");
      return;
    }

    // Filter out empty items (items without a selected product)
    const validItems = items.filter((item) => item.productId);

    if (validItems.length === 0) {
      alert("Please add at least one product");
      return;
    }

    // Calculate totals for valid items only
    const validSubtotal = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const validTotalDiscount = validItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const validGrandTotal = validItems.reduce((sum, item) => sum + item.total, 0);

    setSaving(true);
    try {
      const billData = {
        invoiceNumber,
        date: billDate,
        time: billTime,
        userId: selectedUserId,
        userType: selectedUserType,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountAmount: item.discountAmount,
          total: item.total,
        })),
        subtotal: validSubtotal,
        totalDiscount: validTotalDiscount,
        grandTotal: validGrandTotal,
        status: "pending",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (!res.ok) throw new Error("Failed to create order bill");

      // Clear persisted data after successful save
      clearPersistedData();
      router.push("/admin/dashboard/orders");
    } catch (error) {
      alert("Failed to save order bill");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout title="Generate Order Bill">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                placeholder="INV-XXXXXXXX"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={billTime}
                onChange={(e) => setBillTime(e.target.value)}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
              />
            </div>

            {/* Search User */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search User <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setShowUserDropdown(true);
                  if (selectedUserId) {
                    setSelectedUserId("");
                    setSelectedUserType(null);
                  }
                }}
                onFocus={() => setShowUserDropdown(true)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                placeholder="Search by name, shop, phone..."
              />
              {showUserDropdown && !selectedUserId && (
                <div className="absolute z-10 w-full mt-1 bg-luxury-dark border border-luxury-gray rounded-lg max-h-60 overflow-y-auto shadow-xl">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.slice(0, 10).map((user) => (
                      <button
                        key={`${user.userType}-${user.id}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSelectedUserType(user.userType);
                          setUserSearch(user.name);
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-luxury-gray transition-colors border-b border-gray-700 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{user.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              user.userType === "wholesaler"
                                ? "bg-blue-500/20 text-blue-400"
                                : user.userType === "reseller"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-green-500/20 text-green-400"
                            }`}>
                              {user.userType === "wholesaler" ? "Wholesaler" : user.userType === "reseller" ? "Reseller" : "Customer"}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              user.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}>
                              {user.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {user.shopName && `${user.shopName} | `}
                          {user.companyName && `${user.companyName} | `}
                          {user.contactNumber}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-400 text-center">
                      {userSearch ? "No users found" : "No users available. Add users first."}
                    </div>
                  )}
                  {filteredUsers.length > 10 && (
                    <div className="px-4 py-2 text-gray-500 text-sm border-t border-gray-700">
                      +{filteredUsers.length - 10} more users...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="mt-4 p-4 bg-luxury-gray rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-sm">Selected User:</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedUserType === "wholesaler"
                        ? "bg-blue-500/20 text-blue-400"
                        : selectedUserType === "reseller"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {selectedUserType === "wholesaler" ? "Wholesaler" : selectedUserType === "reseller" ? "Reseller" : "Customer"}
                    </span>
                  </div>
                  <div className="text-white font-medium">{selectedUser.name}</div>
                  <div className="text-gray-400 text-sm">
                    {selectedUser.shopName && `${selectedUser.shopName} | `}
                    {selectedUser.companyName && `${selectedUser.companyName} | `}
                    {selectedUser.contactNumber} {selectedUser.email && `| ${selectedUser.email}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId("");
                    setSelectedUserType(null);
                    setUserSearch("");
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Products</h3>
            <button
              type="button"
              onClick={() => setShowQuickAddProduct(true)}
              className="text-luxury-gold hover:underline text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Quick Add Product
            </button>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray">
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Product</th>
                  <th className="text-center py-3 px-2 text-gray-400 text-sm font-medium w-24">Qty</th>
                  <th className="text-center py-3 px-2 text-gray-400 text-sm font-medium w-32">Unit Price</th>
                  <th className="text-center py-3 px-2 text-gray-400 text-sm font-medium w-40">Discount</th>
                  <th className="text-right py-3 px-2 text-gray-400 text-sm font-medium w-32">Total</th>
                  <th className="text-center py-3 px-2 text-gray-400 text-sm font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700">
                    {/* Product Selection */}
                    <td className="py-3 px-2">
                      <div>
                        {/* Selected Product Display */}
                        {item.productId ? (
                          <div className="flex items-center gap-3 p-2 bg-luxury-gray border border-gray-600 rounded-lg">
                            {/* Product Image */}
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-gray-400 text-xs">SKU: {item.productSku}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {item.productSize && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                    {item.productSize}
                                  </span>
                                )}
                                {item.productCategory && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                    {item.productCategory}
                                  </span>
                                )}
                                {item.productBrand && (
                                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                                    {item.productBrand}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, { productId: "", productName: "", productSku: "", productImage: "", productSize: "", productCategory: "", productBrand: "", sizeQuantities: [], quantity: 1 });
                                setProductSearches({ ...productSearches, [item.id]: "" });
                              }}
                              className="text-gray-400 hover:text-red-400 p-1 flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          (() => {
                            const searchValue = productSearches[item.id] || "";
                            return (
                          <>
                            {/* Search Input */}
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => {
                                  setProductSearches({ ...productSearches, [item.id]: e.target.value });
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-luxury-gold"
                                placeholder="Type to search products..."
                              />
                              {searchValue && (
                                <button
                                  type="button"
                                  onClick={() => setProductSearches({ ...productSearches, [item.id]: "" })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Product Preview - Shows immediately when typing */}
                            {searchValue.length > 0 && (
                              <div className="mt-2 bg-luxury-dark border border-luxury-gray rounded-xl overflow-hidden">
                                {/* Search results count */}
                                <div className="px-3 py-2 bg-luxury-gray/50 border-b border-gray-700 flex items-center justify-between">
                                  <p className="text-xs text-gray-400">
                                    {getFilteredProducts(item.id).length} product{getFilteredProducts(item.id).length !== 1 ? 's' : ''} found
                                  </p>
                                  <p className="text-xs text-gray-500">Click to select</p>
                                </div>
                                {/* Products grid */}
                                <div className="max-h-64 overflow-y-auto p-2">
                                  {getFilteredProducts(item.id).length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {getFilteredProducts(item.id).slice(0, 8).map((product) => (
                                        <button
                                          key={product.id}
                                          type="button"
                                          onClick={() => selectProduct(item.id, product.id)}
                                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-luxury-gray transition-colors text-left border border-transparent hover:border-luxury-gold/50"
                                        >
                                          {/* Product Image */}
                                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                                            {product.images && product.images[0] ? (
                                              <img
                                                src={product.images[0]}
                                                alt={product.name || product.sku}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                              </div>
                                            )}
                                          </div>
                                          {/* Product Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-medium line-clamp-1">
                                              {product.name || product.sku}
                                            </p>
                                            <p className="text-gray-500 text-xs">SKU: {product.sku}</p>
                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                              <span className="text-amber-500 text-xs truncate">{product.brandName}</span>
                                              <span className="text-gray-600">•</span>
                                              <span className="text-gray-400 text-xs truncate">{product.categoryName}</span>
                                              {product.sizes && product.sizes.length > 0 && (
                                                <>
                                                  <span className="text-gray-600">•</span>
                                                  <span className="text-blue-400 text-xs truncate">
                                                    {product.sizes.map(s => s.name).join(", ")}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-6 text-center">
                                      <svg className="w-10 h-10 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <p className="text-gray-400 text-sm">No products found</p>
                                      <p className="text-gray-500 text-xs mt-1">Try different keywords</p>
                                    </div>
                                  )}
                                </div>
                                {getFilteredProducts(item.id).length > 8 && (
                                  <div className="px-3 py-2 text-gray-500 text-xs border-t border-gray-700 text-center bg-luxury-gray/30">
                                    +{getFilteredProducts(item.id).length - 8} more products
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Initial hint when empty */}
                            {searchValue.length === 0 && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Search by name, SKU, brand, or category
                              </p>
                            )}
                          </>
                            );
                          })()
                        )}
                      </div>
                    </td>

                    {/* Quantity - with size popup for multi-size products */}
                    <td className="py-3 px-2">
                      {item.sizeQuantities.length > 1 ? (
                        <div className="space-y-2">
                          {/* Clickable quantity display with size indicator */}
                          <button
                            type="button"
                            onClick={() => toggleSizeInputExpansion(item.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full justify-center ${
                              expandedSizeInputs.has(item.id)
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
                              <span className="font-medium">{item.quantity}</span>
                            )}
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedSizeInputs.has(item.id) ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {/* Size count badge */}
                          {!expandedSizeInputs.has(item.id) && (
                            <p className="text-xs text-gray-500 text-center">{item.sizeQuantities.length} sizes</p>
                          )}

                          {/* Expanded size inputs */}
                          {expandedSizeInputs.has(item.id) && (
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
                                      onChange={(e) => handleSizeQuantityChange(item.id, sizeIdx, parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1.5 bg-luxury-gray border border-gray-500 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-luxury-gold"
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
                                  onClick={() => toggleSizeInputExpansion(item.id)}
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
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-sm text-center focus:outline-none focus:border-luxury-gold"
                        />
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-sm text-center focus:outline-none focus:border-luxury-gold"
                        placeholder="0"
                      />
                    </td>

                    {/* Discount */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={item.discountType}
                          onChange={(e) =>
                            updateItem(item.id, {
                              discountType: e.target.value as "none" | "percentage" | "amount",
                              discountValue: 0,
                            })
                          }
                          className="px-2 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-luxury-gold"
                        >
                          <option value="none">None</option>
                          <option value="percentage">%</option>
                          <option value="amount">Rs</option>
                        </select>
                        {item.discountType !== "none" && (
                          <input
                            type="number"
                            min="0"
                            value={item.discountValue}
                            onChange={(e) =>
                              updateItem(item.id, { discountValue: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white text-sm text-center focus:outline-none focus:border-luxury-gold"
                            placeholder="0"
                          />
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-2 text-right">
                      <span className="text-white font-medium">{formatCurrency(item.total)}</span>
                      {item.discountAmount > 0 && (
                        <div className="text-xs text-green-400">-{formatCurrency(item.discountAmount)}</div>
                      )}
                    </td>

                    {/* Remove */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add More Button */}
          <button
            type="button"
            onClick={addItem}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-luxury-gold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Summary Section */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bill Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span>Total Discount</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between text-xl font-bold">
              <span className="text-white">Grand Total</span>
              <span className="text-luxury-gold">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/dashboard/orders"
            className="px-6 py-3 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to clear all bill data? This cannot be undone.")) {
                clearPersistedData();
                // Reset form to initial state
                const now = new Date();
                const dateStr = (now.toISOString().split("T")[0] || "").replace(/-/g, "");
                const timeStr = now.getTime().toString().slice(-4);
                setInvoiceNumber(`INV-${dateStr}-${timeStr}`);
                setBillDate(now.toISOString().split("T")[0] || "");
                setBillTime(now.toTimeString().slice(0, 5));
                setSelectedUserId("");
                setSelectedUserType(null);
                setUserSearch("");
                setItems([{
                  id: `item-${Date.now()}`,
                  productId: "",
                  productName: "",
                  productSku: "",
                  productImage: "",
                  productSize: "",
                  productCategory: "",
                  productBrand: "",
                  quantity: 1,
                  sizeQuantities: [],
                  unitPrice: 0,
                  discountType: "none",
                  discountValue: 0,
                  discountAmount: 0,
                  total: 0,
                }]);
                setProductSearches({});
              }
            }}
            className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Clear Draft
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedUserId || items.length === 0}
            className="px-6 py-3 bg-luxury-gold text-black rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : "Generate Bill"}
          </button>
        </div>
      </div>

      {/* Quick Add Product Modal */}
      {showQuickAddProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Quick Add Product</h3>
              <button
                type="button"
                onClick={() => setShowQuickAddProduct(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickProduct.sku}
                  onChange={(e) => setQuickProduct({ ...quickProduct, sku: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                  placeholder="Enter product SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={quickProduct.description}
                  onChange={(e) => setQuickProduct({ ...quickProduct, description: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={quickProduct.categoryId}
                  onChange={(e) => setQuickProduct({ ...quickProduct, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter((c) => c.status === "active")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  value={quickProduct.brandId}
                  onChange={(e) => setQuickProduct({ ...quickProduct, brandId: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="">Select Brand</option>
                  {brands
                    .filter((b) => b.status === "active")
                    .map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowQuickAddProduct(false)}
                className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddProduct}
                disabled={addingProduct}
                className="px-4 py-2 bg-luxury-gold text-black rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 font-medium"
              >
                {addingProduct ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
