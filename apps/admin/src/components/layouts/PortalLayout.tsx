"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type UserType = "wholesaler" | "reseller" | "retailer";

interface UserInfo {
  id: string;
  name: string;
  type: UserType;
}

const USER_TYPE_CONFIG = {
  wholesaler: {
    label: "Wholesaler",
    priceLabel: "Wholesale Price",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  reseller: {
    label: "Reseller",
    priceLabel: "Reseller Price",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  retailer: {
    label: "Retail Customer",
    priceLabel: "Offer Price",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value || "";
      return acc;
    }, {} as Record<string, string>);

    const userId = cookies["user_id"] || "";
    const userType = (cookies["user_type"] || "retailer") as UserType;
    const userName = decodeURIComponent(cookies["user_name"] || "User");

    if (!userId || !userType) {
      router.push("/login");
      return;
    }

    setUserInfo({
      id: userId,
      name: userName,
      type: userType,
    });
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    document.cookie = "user_id=; path=/; max-age=0";
    document.cookie = "user_type=; path=/; max-age=0";
    document.cookie = "user_name=; path=/; max-age=0";
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/portal/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      name: "Import Products",
      href: "/portal/products",
      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    },
    {
      name: "My Store",
      href: "/portal/store",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      name: "Orders",
      href: "/portal/orders",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      name: "Settings",
      href: "/portal/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  if (loading || !userInfo) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  const config = USER_TYPE_CONFIG[userInfo.type];

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-luxury-dark border-r border-luxury-gray transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-luxury-gray">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-luxury-gold">MyLuxury</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Type Badge */}
        <div className="px-4 py-3 border-b border-luxury-gray">
          <div className={`${config.bgColor} rounded-lg px-3 py-2 flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`}></div>
            <span className={`text-sm font-medium ${config.color}`}>{config.label} Account</span>
          </div>
        </div>

        {/* DEV: Back to Admin */}
        <div className="px-4 py-2 border-b border-luxury-gray">
          <button
            onClick={() => {
              document.cookie = "admin_auth=true; path=/";
              window.location.href = "/admin/dashboard";
            }}
            className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-luxury-gold/20 text-luxury-gold"
                    : "text-gray-400 hover:bg-luxury-gray hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-luxury-gray">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-luxury-dark border-b border-luxury-gray flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Price Type Indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
              <span className={`text-xs font-medium ${config.color}`}>
                Viewing: {config.priceLabel}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{userInfo?.name}</p>
                <p className={`text-xs ${config.color}`}>{config.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${config.color}`}>
                  {userInfo?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export { USER_TYPE_CONFIG };
export type { UserType, UserInfo };
