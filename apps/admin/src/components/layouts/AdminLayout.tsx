"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (paths: string[]) => paths.some((p) => pathname.startsWith(p));
  const isResellersActive = isActiveParent(["/admin/dashboard/resellers"]);
  const isWholesalersActive = isActiveParent(["/admin/dashboard/wholesalers"]);
  const isRetailersActive = isActiveParent(["/admin/dashboard/retailers"]);
  const isAllUsersActive = isActive("/admin/dashboard/users");
  const isManageUsersActive = isResellersActive || isWholesalersActive || isRetailersActive || isAllUsersActive;
  const isVendorsActive = isActiveParent(["/admin/dashboard/vendors"]);
  const isPurchaseActive = isActiveParent(["/admin/dashboard/purchase"]);
  const isListingsActive = isActiveParent(["/admin/dashboard/categories", "/admin/dashboard/brands", "/admin/dashboard/products", "/admin/dashboard/sizes"]);
  const isOrdersActive = isActiveParent(["/admin/dashboard/orders"]);

  // Collapsible menu state - track hovered menu
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  useEffect(() => {
    const isAuthenticated = document.cookie.includes("admin_auth=true");
    if (!isAuthenticated) {
      router.push("/admin/login");
    } else {
      setAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    document.cookie = "admin_auth=; path=/; max-age=0";
    router.push("/admin/login");
  };

  // Check if menu should be expanded
  // If hovering any menu, only show that one. Otherwise show active menu.
  const isMenuExpanded = (menu: string, isActive: boolean) => {
    if (hoveredMenu !== null) {
      // When hovering, only show the hovered menu's submenu
      return hoveredMenu === menu;
    }
    // When not hovering, show the active page's menu
    return isActive;
  };

  const handleMouseEnter = (menu: string) => {
    setHoveredMenu(menu);
  };

  const handleMouseLeave = () => {
    setHoveredMenu(null);
  };

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="text-luxury-gold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-luxury-dark border-r border-luxury-gray overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
          <p className="text-gray-500 text-sm">Admin Panel</p>
        </div>
        <nav className="mt-6 pb-6" onMouseLeave={handleMouseLeave}>
          {/* Dashboard */}
          <Link
            href="/admin/dashboard"
            className={`flex items-center px-6 py-3 transition-colors ${
              isActive("/admin/dashboard")
                ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                : "text-gray-400 hover:text-white hover:bg-luxury-gray"
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {/* Manage Users */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("manageUsers")}
          >
            <button
              className={`flex items-center justify-between w-full px-6 py-3 transition-colors ${
                isManageUsersActive
                  ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                  : "text-gray-400 hover:text-white hover:bg-luxury-gray"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Users
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuExpanded("manageUsers", isManageUsersActive) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMenuExpanded("manageUsers", isManageUsersActive) && (
              <div className="bg-luxury-dark border-l-2 border-luxury-gray ml-4">
                {/* All Users - Unified View */}
                <Link
                  href="/admin/dashboard/users"
                  className={`flex items-center px-6 py-2 pl-6 text-sm transition-colors ${
                    isAllUsersActive ? "text-luxury-gold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  All Users
                </Link>

                {/* Wholesalers */}
                <Link
                  href="/admin/dashboard/wholesalers"
                  className={`flex items-center px-6 py-2 pl-6 text-sm transition-colors ${
                    isWholesalersActive ? "text-luxury-gold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Wholesalers
                </Link>

                {/* Resellers */}
                <Link
                  href="/admin/dashboard/resellers"
                  className={`flex items-center px-6 py-2 pl-6 text-sm transition-colors ${
                    isResellersActive ? "text-luxury-gold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Resellers
                </Link>

                {/* Retailers */}
                <Link
                  href="/admin/dashboard/retailers"
                  className={`flex items-center px-6 py-2 pl-6 text-sm transition-colors ${
                    isRetailersActive ? "text-luxury-gold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Retail Customers
                </Link>
              </div>
            )}
          </div>

          {/* Manage Vendor */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("vendors")}
          >
            <Link
              href="/admin/dashboard/vendors"
              className={`flex items-center justify-between w-full px-6 py-3 transition-colors ${
                isVendorsActive
                  ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                  : "text-gray-400 hover:text-white hover:bg-luxury-gray"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Vendor
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuExpanded("vendors", isVendorsActive) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            {isMenuExpanded("vendors", isVendorsActive) && (
              <div className="bg-luxury-dark border-l-2 border-luxury-gray ml-4">
                <Link
                  href="/admin/dashboard/vendors/new"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/vendors/new") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Vendor
                </Link>
                <Link
                  href="/admin/dashboard/vendors"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/vendors") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Vendor List
                </Link>
              </div>
            )}
          </div>

          {/* Manage Purchase */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("purchase")}
          >
            <Link
              href="/admin/dashboard/purchase"
              className={`flex items-center justify-between w-full px-6 py-3 transition-colors ${
                isPurchaseActive
                  ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                  : "text-gray-400 hover:text-white hover:bg-luxury-gray"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Manage Purchase
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuExpanded("purchase", isPurchaseActive) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            {isMenuExpanded("purchase", isPurchaseActive) && (
              <div className="bg-luxury-dark border-l-2 border-luxury-gray ml-4">
                <Link
                  href="/admin/dashboard/purchase/new"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/purchase/new") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Purchase Bill
                </Link>
                <Link
                  href="/admin/dashboard/purchase"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/purchase") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Purchase Bill List
                </Link>
                <Link
                  href="/admin/dashboard/purchase/inventory"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/purchase/inventory") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Product Inventory
                </Link>
              </div>
            )}
          </div>

          {/* Listings */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("listings")}
          >
            <Link
              href="/admin/dashboard/products"
              className={`flex items-center justify-between w-full px-6 py-3 transition-colors ${
                isListingsActive
                  ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                  : "text-gray-400 hover:text-white hover:bg-luxury-gray"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Manage Products
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuExpanded("listings", isListingsActive) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            {isMenuExpanded("listings", isListingsActive) && (
              <div className="bg-luxury-dark border-l-2 border-luxury-gray ml-4">
                <Link
                  href="/admin/dashboard/categories"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActiveParent(["/admin/dashboard/categories"]) ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Manage Categories
                </Link>
                <Link
                  href="/admin/dashboard/brands"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActiveParent(["/admin/dashboard/brands"]) ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Manage Brands
                </Link>
                <Link
                  href="/admin/dashboard/sizes"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActiveParent(["/admin/dashboard/sizes"]) ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Manage Sizes
                </Link>
                <Link
                  href="/admin/dashboard/products"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActiveParent(["/admin/dashboard/products"]) ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Product List
                </Link>
              </div>
            )}
          </div>

          {/* Manage Order */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("orders")}
          >
            <Link
              href="/admin/dashboard/orders"
              className={`flex items-center justify-between w-full px-6 py-3 transition-colors ${
                isOrdersActive
                  ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                  : "text-gray-400 hover:text-white hover:bg-luxury-gray"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Manage Order
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuExpanded("orders", isOrdersActive) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            {isMenuExpanded("orders", isOrdersActive) && (
              <div className="bg-luxury-dark border-l-2 border-luxury-gray ml-4">
                <Link
                  href="/admin/dashboard/orders/new"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/orders/new") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Generate Order Bill
                </Link>
                <Link
                  href="/admin/dashboard/orders"
                  className={`flex items-center px-6 py-2 pl-10 text-sm transition-colors ${
                    isActive("/admin/dashboard/orders") ? "text-luxury-gold" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List of Generated Bills
                </Link>
              </div>
            )}
          </div>

          {/* Settings */}
          <Link
            href="/admin/dashboard/settings"
            className={`flex items-center px-6 py-3 transition-colors ${
              isActiveParent(["/admin/dashboard/settings"])
                ? "text-white bg-luxury-gray border-l-4 border-luxury-gold"
                : "text-gray-400 hover:text-white hover:bg-luxury-gray"
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-luxury-dark border-b border-luxury-gray px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="flex items-center gap-4">
            {actions}
            {/* DEV: Quick User Switch */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <span className="text-purple-400 text-xs font-medium">DEV:</span>
              <button
                onClick={() => {
                  document.cookie = "user_type=reseller; path=/";
                  document.cookie = "user_id=cmjkgmfqr0001cuf7mob6c62i; path=/";
                  window.location.href = "/portal/dashboard";
                }}
                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs rounded transition-colors"
              >
                Reseller
              </button>
              <button
                onClick={() => {
                  document.cookie = "user_type=wholesaler; path=/";
                  document.cookie = "user_id=cmjkgmfqd0000cuf7eatgpkw8; path=/";
                  window.location.href = "/portal/dashboard";
                }}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs rounded transition-colors"
              >
                Wholesaler
              </button>
              <button
                onClick={() => {
                  document.cookie = "user_type=retailer; path=/";
                  document.cookie = "user_id=cmjkgmfr00002cuf746bgaqzm; path=/";
                  window.location.href = "/portal/dashboard";
                }}
                className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 text-xs rounded transition-colors"
              >
                Retailer
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
