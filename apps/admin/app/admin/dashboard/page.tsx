"use client";

import AdminLayout from "@/src/components/layouts/AdminLayout";
import {
  useResellers,
  useWholesalers,
  useRetailers,
  useProducts,
  usePurchaseBills,
  useBusinessTotals,
  useVendors,
} from "@/src/hooks/entities";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  link?: string;
}

function StatCard({ title, value, icon, iconBg, iconColor, valueColor = "text-white", link }: StatCardProps) {
  const content = (
    <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-luxury-gray/80 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${valueColor} mt-1`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

export default function AdminDashboard() {
  const { resellers } = useResellers();
  const { wholesalers } = useWholesalers();
  const { retailers } = useRetailers();
  const { products } = useProducts();
  const { bills } = usePurchaseBills();
  const { vendors } = useVendors();
  const { totals: businessTotals } = useBusinessTotals();

  // Calculate stats
  const totalResellers = resellers.length;
  const totalWholesalers = wholesalers.length;
  const totalRetailers = retailers.length;
  const totalProducts = products.length;
  const totalPurchases = bills.length;
  const totalVendors = vendors.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout title="Dashboard">
      {/* User Stats with Business Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Wholesalers */}
        <Link href="/admin/dashboard/wholesalers" className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-orange-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Wholesalers</p>
              <p className="text-3xl font-bold text-white mt-1">{totalWholesalers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <p className="text-gray-400 text-xs mb-1">Total Business</p>
            <p className="text-xl font-bold text-orange-400">{formatCurrency(businessTotals.wholesaler.totalBusiness)}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-400">Paid: {formatCurrency(businessTotals.wholesaler.paidBusiness)}</span>
              <span className="text-yellow-400">Pending: {formatCurrency(businessTotals.wholesaler.totalBusiness - businessTotals.wholesaler.paidBusiness)}</span>
            </div>
          </div>
        </Link>

        {/* Resellers */}
        <Link href="/admin/dashboard/resellers" className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Resellers</p>
              <p className="text-3xl font-bold text-white mt-1">{totalResellers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <p className="text-gray-400 text-xs mb-1">Total Business</p>
            <p className="text-xl font-bold text-blue-400">{formatCurrency(businessTotals.reseller.totalBusiness)}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-400">Paid: {formatCurrency(businessTotals.reseller.paidBusiness)}</span>
              <span className="text-yellow-400">Pending: {formatCurrency(businessTotals.reseller.totalBusiness - businessTotals.reseller.paidBusiness)}</span>
            </div>
          </div>
        </Link>

        {/* Customers */}
        <Link href="/admin/dashboard/retailers" className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-cyan-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Customers</p>
              <p className="text-3xl font-bold text-white mt-1">{totalRetailers}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <p className="text-gray-400 text-xs mb-1">Total Business</p>
            <p className="text-xl font-bold text-cyan-400">{formatCurrency(businessTotals.retail.totalBusiness)}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-400">Paid: {formatCurrency(businessTotals.retail.paidBusiness)}</span>
              <span className="text-yellow-400">Pending: {formatCurrency(businessTotals.retail.totalBusiness - businessTotals.retail.paidBusiness)}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Financial Stats - Investment, Sales, Stock Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Investment */}
        <Link href="/admin/dashboard/purchase" className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-red-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Investment</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(businessTotals.investment.total)}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <div className="flex gap-4 text-xs">
              <span className="text-green-400">Paid: {formatCurrency(businessTotals.investment.paid)}</span>
              <span className="text-yellow-400">Pending: {formatCurrency(businessTotals.investment.pending)}</span>
            </div>
            <p className="text-gray-500 text-xs mt-2">{businessTotals.investment.billCount} purchase bills</p>
          </div>
        </Link>

        {/* Total Sales */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Sales</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(businessTotals.totalSales)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-orange-400">Wholesale</span>
                <p className="text-white font-medium">{formatCurrency(businessTotals.wholesaler.totalBusiness)}</p>
              </div>
              <div>
                <span className="text-blue-400">Reseller</span>
                <p className="text-white font-medium">{formatCurrency(businessTotals.reseller.totalBusiness)}</p>
              </div>
              <div>
                <span className="text-cyan-400">Customer</span>
                <p className="text-white font-medium">{formatCurrency(businessTotals.retail.totalBusiness)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Value */}
        <Link href="/admin/dashboard/purchase/inventory" className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Stock Value (Cost)</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{formatCurrency(businessTotals.stock.costValue)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="border-t border-luxury-gray pt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Retail Value:</span>
              <span className="text-white font-medium">{formatCurrency(businessTotals.stock.retailValue)}</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Potential Profit:</span>
              <span className="text-green-400 font-medium">{formatCurrency(businessTotals.stock.potentialProfit)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Items in Stock:</span>
              <span className="text-white font-medium">{businessTotals.stock.quantity}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Products, Purchase & Vendors Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Products */}
        <StatCard
          title="Products"
          value={totalProducts}
          iconBg="bg-green-500/20"
          iconColor="text-green-500"
          link="/admin/dashboard/products"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        {/* Purchase Bills */}
        <StatCard
          title="Purchase Bills"
          value={totalPurchases}
          iconBg="bg-purple-500/20"
          iconColor="text-purple-500"
          link="/admin/dashboard/purchase"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        {/* Vendors */}
        <StatCard
          title="Vendors"
          value={totalVendors}
          iconBg="bg-pink-500/20"
          iconColor="text-pink-500"
          link="/admin/dashboard/vendors"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Welcome Card */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8">
        <h3 className="text-2xl font-semibold text-white mb-4">Welcome to MyLuxuryNetwork Admin</h3>
        <p className="text-gray-400 mb-6">
          Manage your luxury marketplace from this dashboard. Use the quick actions below to get started.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/dashboard/wholesalers/new" className="bg-luxury-gray rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <h4 className="text-luxury-gold font-medium mb-2">+ Add Wholesaler</h4>
            <p className="text-gray-400 text-sm">Register a new wholesaler partner</p>
          </Link>
          <Link href="/admin/dashboard/resellers/new" className="bg-luxury-gray rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <h4 className="text-luxury-gold font-medium mb-2">+ Add Reseller</h4>
            <p className="text-gray-400 text-sm">Register a new reseller partner</p>
          </Link>
          <Link href="/admin/dashboard/retailers/new" className="bg-luxury-gray rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <h4 className="text-luxury-gold font-medium mb-2">+ Add Customer</h4>
            <p className="text-gray-400 text-sm">Register a new customer</p>
          </Link>
          <Link href="/admin/dashboard/products/new" className="bg-luxury-gray rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <h4 className="text-luxury-gold font-medium mb-2">+ Add Product</h4>
            <p className="text-gray-400 text-sm">List a new luxury product</p>
          </Link>
          <Link href="/admin/dashboard/purchase/new" className="bg-luxury-gray rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <h4 className="text-luxury-gold font-medium mb-2">+ New Purchase</h4>
            <p className="text-gray-400 text-sm">Record a new purchase bill</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
