"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface WholesaleLayoutProps {
  children: React.ReactNode;
}

export default function WholesaleLayout({ children }: WholesaleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check if wholesale is authenticated
    const isAuth = document.cookie.includes("wholesale_auth=true");
    if (!isAuth) {
      router.push("/wholesale/login");
      return;
    }
    setAuthenticated(true);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    document.cookie = "wholesale_auth=; path=/; max-age=0";
    router.push("/wholesale/login");
  };

  const isActive = (path: string) => pathname === path;
  const isManageProductsActive = pathname?.includes("/wholesale/dashboard/manage-products");

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Header */}
      <header className="bg-luxury-dark border-b border-luxury-gray">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/wholesale/dashboard">
            <h1 className="text-2xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, Wholesale</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-65px)] bg-luxury-dark border-r border-luxury-gray p-4">
          <nav className="space-y-2">
            {/* Dashboard */}
            <Link
              href="/wholesale/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/wholesale/dashboard")
                  ? "bg-luxury-gold/20 text-luxury-gold"
                  : "text-gray-400 hover:bg-luxury-gray/50 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            {/* Manage Your Store - Link to page */}
            <Link
              href="/wholesale/dashboard/manage-products"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isManageProductsActive
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 hover:bg-luxury-gray/50 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Manage Your Store
            </Link>

            {/* My Store */}
            <Link
              href="/wholesale/dashboard/store"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/wholesale/dashboard/store")
                  ? "bg-luxury-gold/20 text-luxury-gold"
                  : "text-gray-400 hover:bg-luxury-gray/50 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Store
            </Link>

            {/* My Store Frontend */}
            <Link
              href="/wholesale/dashboard/store-frontend"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/wholesale/dashboard/store-frontend")
                  ? "bg-luxury-gold/20 text-luxury-gold"
                  : "text-gray-400 hover:bg-luxury-gray/50 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              My Store Frontend
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
