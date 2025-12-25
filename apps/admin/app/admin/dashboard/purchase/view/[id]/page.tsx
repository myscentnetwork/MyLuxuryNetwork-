"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";

interface PurchaseItem {
  productId: string;
  productSku?: string;
  sku?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  costPrice: number;
  total: number;
}

interface PurchasePayment {
  id: string;
  amount: number;
  paymentMode: string;
  transactionDetails?: string | null;
  notes?: string | null;
  paymentDate: string;
  paymentTime?: string | null;
  createdAt: string;
}

interface PurchaseBill {
  id: string;
  billNumber: string;
  date: string;
  time?: string | null;
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  payments: PurchasePayment[];
  shippingCharges?: number;
  miscellaneous?: number;
  originalBox?: number;
  totalAmount: number;
  paidAmount?: number;
  amountPaid?: number;
  balanceAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

export default function ViewPurchaseBill() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [bill, setBill] = useState<PurchaseBill | null>(null);
  const [activeTab, setActiveTab] = useState<"purchase" | "landing">("purchase");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Expense form state
  const [expenses, setExpenses] = useState({
    shippingCharges: 0,
    miscellaneous: 0,
    originalBox: 0,
  });

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    paymentMode: "cash" as string,
    transactionDetails: "",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentTime: new Date().toTimeString().slice(0, 5),
  });

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

        const data = await res.json();
        setBill(data);
        // Load existing expenses
        setExpenses({
          shippingCharges: data.shippingCharges || 0,
          miscellaneous: data.miscellaneous || 0,
          originalBox: data.originalBox || 0,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":") as [string, string];
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const handleSaveExpenses = async () => {
    if (!bill) return;

    try {
      setSaving(true);

      const totalItems = bill.items.reduce((sum, item) => sum + item.quantity, 0);
      const extraCharges = expenses.shippingCharges + expenses.miscellaneous + expenses.originalBox;
      const distributedCost = totalItems > 0 ? extraCharges / totalItems : 0;

      const res = await fetch(`/api/purchase-bills/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bill,
          shippingCharges: expenses.shippingCharges,
          miscellaneous: expenses.miscellaneous,
          originalBox: expenses.originalBox,
          items: bill.items.map((item) => ({
            productId: item.productId,
            productSku: item.productSku || item.sku,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            costPrice: item.costPrice,
            distributedCost: distributedCost,
            finalCostPrice: item.costPrice + distributedCost,
            total: item.total,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to save expenses");

      const updatedBill = await res.json();
      setBill(updatedBill);
      setActiveTab("landing");
      alert("Expenses saved! Landing Cost Invoice generated.");
    } catch (error) {
      console.error("Error saving expenses:", error);
      alert("Failed to save expenses");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!bill) return;

    // Calculate total with expenses
    const billExpenses = (bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0);
    const totalWithExpenses = (bill.totalAmount || 0) + billExpenses;
    const paidAmount = bill.paidAmount || 0;
    const calculatedBalance = totalWithExpenses - paidAmount;

    if (newPayment.amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (newPayment.amount > calculatedBalance) {
      alert(`Payment amount cannot exceed balance of ${formatCurrency(calculatedBalance)}`);
      return;
    }

    if (!newPayment.paymentMode) {
      alert("Please select a payment mode");
      return;
    }

    try {
      setAddingPayment(true);

      const res = await fetch(`/api/purchase-bills/${bill.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add payment");
      }

      // Refresh bill data
      const billRes = await fetch(`/api/purchase-bills/${bill.id}`);
      if (billRes.ok) {
        const updatedBill = await billRes.json();
        setBill(updatedBill);
      }

      // Reset form
      setNewPayment({
        amount: 0,
        paymentMode: "cash",
        transactionDetails: "",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentTime: new Date().toTimeString().slice(0, 5),
      });
      setShowPaymentForm(false);

      alert("Payment added successfully!");
    } catch (error) {
      console.error("Error adding payment:", error);
      alert(error instanceof Error ? error.message : "Failed to add payment");
    } finally {
      setAddingPayment(false);
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      cheque: "Cheque",
      credit: "Credit",
    };
    return modes[mode] || mode;
  };

  if (loading) {
    return (
      <AdminLayout title="View Purchase Bill">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!bill) {
    return null;
  }

  // Calculate values
  const totalItems = bill.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = bill.items.reduce((sum, item) => sum + item.total, 0);
  const extraCharges = expenses.shippingCharges + expenses.miscellaneous + expenses.originalBox;
  const distributedCostPerItem = totalItems > 0 ? extraCharges / totalItems : 0;
  const hasExpenses = extraCharges > 0;

  return (
    <AdminLayout
      title="Purchase Bill"
      actions={
        <div className="flex gap-2">
          <Link
            href={`/admin/dashboard/purchase/edit/${bill.id}`}
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <Link
            href="/admin/dashboard/purchase"
            className="bg-luxury-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      }
    >
      <div className="max-w-5xl space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("purchase")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "purchase"
                ? "bg-luxury-gold text-black"
                : "bg-luxury-gray text-gray-300 hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Purchase Invoice
            </div>
          </button>
          <button
            onClick={() => setActiveTab("landing")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "landing"
                ? "bg-green-500 text-white"
                : hasExpenses
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                  : "bg-luxury-gray text-gray-500 cursor-not-allowed"
            }`}
            disabled={!hasExpenses}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Landing Cost Invoice
              {!hasExpenses && <span className="text-xs">(Add expenses first)</span>}
            </div>
          </button>
        </div>

        {/* Bill Header */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{bill.billNumber}</h2>
              <p className="text-gray-400 mt-1">
                {activeTab === "purchase" ? "Purchase Invoice" : "Landing Cost Invoice"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg border text-center ${getStatusColor(bill.status)}`}>
                <p className="text-lg font-semibold capitalize">{bill.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3 mb-4">Bill Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Date</p>
              <p className="text-white font-medium mt-1">{formatDate(bill.date)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Time</p>
              <p className="text-white font-medium mt-1">{formatTime(bill.time)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Vendor</p>
              <p className="text-white font-medium mt-1">{bill.vendorName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Items</p>
              <p className="text-white font-medium mt-1">{totalItems} pieces</p>
            </div>
          </div>
        </div>

        {/* Purchase Invoice Tab */}
        {activeTab === "purchase" && (
          <>
            {/* Products Table - Simple */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
              <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3 mb-4">
                Products ({bill.items.length} items)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">#</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Image</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">SKU</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Qty</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Cost Price</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index} className="border-b border-luxury-gray/50">
                        <td className="px-4 py-4 text-gray-400">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                            {item.productSku || item.sku || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white">{item.productName}</td>
                        <td className="px-4 py-4 text-right text-white">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{formatCurrency(item.costPrice)}</td>
                        <td className="px-4 py-4 text-right text-luxury-gold font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-luxury-gray">
                      <td colSpan={5}></td>
                      <td className="px-4 py-4 text-right text-gray-400 font-medium">Subtotal</td>
                      <td className="px-4 py-4 text-right text-2xl font-bold text-luxury-gold">{formatCurrency(itemsTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Add Expenses Section */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Add Expenses</h3>
                  <p className="text-sm text-gray-400">Add shipping, box & other charges to calculate landing cost</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Shipping Charges</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenses.shippingCharges || ""}
                    onChange={(e) => setExpenses({ ...expenses, shippingCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Original Box</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenses.originalBox || ""}
                    onChange={(e) => setExpenses({ ...expenses, originalBox: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Miscellaneous</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenses.miscellaneous || ""}
                    onChange={(e) => setExpenses({ ...expenses, miscellaneous: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Preview */}
              {extraCharges > 0 && (
                <div className="bg-luxury-dark/50 rounded-lg p-4 mb-6">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-400">Total Expenses:</span>
                    <span className="text-xl font-bold text-blue-400">{formatCurrency(extraCharges)}</span>
                    <span className="text-gray-500">÷</span>
                    <span className="text-gray-400">{totalItems} items</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-400 font-bold">+{formatCurrency(distributedCostPerItem)} per piece</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveExpenses}
                disabled={saving || extraCharges === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Save & Generate Landing Cost Invoice
                  </>
                )}
              </button>
            </div>

            {/* Payment Summary */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
              {(() => {
                const totalWithExpenses = itemsTotal + extraCharges;
                const paidAmount = bill.paidAmount || bill.amountPaid || 0;
                const calculatedBalance = totalWithExpenses - paidAmount;
                return (
                  <div className="flex items-center justify-between border-b border-luxury-gray pb-3 mb-4">
                    <h3 className="text-lg font-medium text-white">Payment Details</h3>
                    {calculatedBalance > 0 && (
                      <button
                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Payment
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Summary Stats */}
              {(() => {
                const totalWithExpenses = itemsTotal + extraCharges;
                const paidAmount = bill.paidAmount || bill.amountPaid || 0;
                const calculatedBalance = totalWithExpenses - paidAmount;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-luxury-gray/30 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm">Vendor Amount</p>
                      <p className="text-xl font-bold text-luxury-gold mt-1">{formatCurrency(itemsTotal)}</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/30">
                      <p className="text-blue-400 text-sm">Expenses</p>
                      <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(extraCharges)}</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/30">
                      <p className="text-purple-400 text-sm">Total</p>
                      <p className="text-xl font-bold text-purple-400 mt-1">{formatCurrency(totalWithExpenses)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
                      <p className="text-green-400 text-sm">Paid</p>
                      <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div className={`rounded-lg p-4 text-center border ${calculatedBalance > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
                      <p className={`text-sm ${calculatedBalance > 0 ? "text-red-400" : "text-green-400"}`}>Balance</p>
                      <p className={`text-xl font-bold mt-1 ${calculatedBalance > 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(calculatedBalance)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Add Payment Form */}
              {(() => {
                const totalWithExpenses = itemsTotal + extraCharges;
                const paidAmount = bill.paidAmount || bill.amountPaid || 0;
                const calculatedBalance = totalWithExpenses - paidAmount;

                if (!showPaymentForm || calculatedBalance <= 0) return null;

                return (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl border border-green-500/30 p-6 mb-6">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Record New Payment
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
                      <input
                        type="number"
                        min="0"
                        max={calculatedBalance}
                        step="0.01"
                        value={newPayment.amount || ""}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={`Max: ${calculatedBalance.toFixed(2)}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Payment Mode *</label>
                      <select
                        value={newPayment.paymentMode}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentMode: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        value={newPayment.paymentDate}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        value={newPayment.paymentTime}
                        onChange={(e) => setNewPayment({ ...newPayment, paymentTime: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Details</label>
                      <input
                        type="text"
                        value={newPayment.transactionDetails}
                        onChange={(e) => setNewPayment({ ...newPayment, transactionDetails: e.target.value })}
                        className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ref / Txn ID"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleAddPayment}
                      disabled={addingPayment || newPayment.amount <= 0}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {addingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Add Payment
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setNewPayment({
                          amount: 0,
                          paymentMode: "cash",
                          transactionDetails: "",
                          notes: "",
                          paymentDate: new Date().toISOString().split("T")[0],
                          paymentTime: new Date().toTimeString().slice(0, 5),
                        });
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    {newPayment.amount > 0 && (
                      <span className="text-sm text-gray-400">
                        Balance after payment: <span className={newPayment.amount >= calculatedBalance ? "text-green-400" : "text-yellow-400"}>
                          {formatCurrency(calculatedBalance - newPayment.amount)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                );
              })()}

              {/* Payment History */}
              {bill.payments && bill.payments.length > 0 ? (
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment History ({bill.payments.length} {bill.payments.length === 1 ? "payment" : "payments"})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-luxury-gray">
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">#</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Mode</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Details</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.payments.map((payment, index) => (
                          <tr key={payment.id} className="border-b border-luxury-gray/50">
                            <td className="px-4 py-3 text-gray-400">{bill.payments.length - index}</td>
                            <td className="px-4 py-3 text-white">{formatDate(payment.paymentDate)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatTime(payment.paymentTime)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                {getPaymentModeLabel(payment.paymentMode)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400">{payment.transactionDetails || "-"}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-lg font-bold text-green-400">{formatCurrency(payment.amount)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No payments recorded yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Landing Cost Invoice Tab */}
        {activeTab === "landing" && hasExpenses && (
          <>
            {/* Landing Cost Header */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-xl border border-green-500/30 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Landing Cost Calculation</h3>
                  <p className="text-sm text-gray-400 mt-1">Final cost per piece including all expenses</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Total Expenses</p>
                    <p className="text-xl font-bold text-blue-400">{formatCurrency(extraCharges)}</p>
                  </div>
                  <div className="text-2xl text-gray-600">÷</div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Total Items</p>
                    <p className="text-xl font-bold text-white">{totalItems}</p>
                  </div>
                  <div className="text-2xl text-gray-600">=</div>
                  <div className="text-center bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/50">
                    <p className="text-xs text-green-400">Per Piece</p>
                    <p className="text-xl font-bold text-green-400">+{formatCurrency(distributedCostPerItem)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
              <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3 mb-4">Expenses Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Shipping Charges</p>
                  <p className="text-xl font-bold text-white mt-1">{formatCurrency(expenses.shippingCharges)}</p>
                </div>
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Original Box</p>
                  <p className="text-xl font-bold text-white mt-1">{formatCurrency(expenses.originalBox)}</p>
                </div>
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Miscellaneous</p>
                  <p className="text-xl font-bold text-white mt-1">{formatCurrency(expenses.miscellaneous)}</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/50">
                  <p className="text-blue-400 text-sm">Total Expenses</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(extraCharges)}</p>
                </div>
              </div>
            </div>

            {/* Products with Landing Cost */}
            <div className="bg-luxury-dark rounded-xl border border-green-500/30 p-6">
              <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3 mb-4">
                Products with Landing Cost
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">#</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Image</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">SKU</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Product</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Qty</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Purchase Cost</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-blue-400">+ Expenses</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-green-400">Landing Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index} className="border-b border-luxury-gray/50">
                        <td className="px-4 py-4 text-gray-400">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-mono rounded">
                            {item.productSku || item.sku || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white">{item.productName}</td>
                        <td className="px-4 py-4 text-right text-white">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{formatCurrency(item.costPrice)}</td>
                        <td className="px-4 py-4 text-right text-blue-400">+{formatCurrency(distributedCostPerItem)}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-lg font-bold text-green-400">{formatCurrency(item.costPrice + distributedCostPerItem)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
              <h3 className="text-lg font-medium text-white border-b border-luxury-gray pb-3 mb-4">Cost Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Purchase Total</p>
                  <p className="text-2xl font-bold text-luxury-gold mt-1">{formatCurrency(itemsTotal)}</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                  <p className="text-blue-400 text-sm">+ Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(extraCharges)}</p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/50">
                  <p className="text-green-400 text-sm">= Total Landing Cost</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(itemsTotal + extraCharges)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
