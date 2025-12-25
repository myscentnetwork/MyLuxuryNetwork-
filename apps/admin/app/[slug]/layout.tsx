"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTelegram,
} from "react-icons/fa";
import { HiOutlineSearch, HiOutlineMenu, HiX } from "react-icons/hi";

interface StoreData {
  id: string;
  slug: string;
  name: string;
  shopName: string;
  contactNumber: string;
  whatsappNumber: string;
  storeAddress: string;
  storeLogo: string | null;
  storeBanner: string | null;
  tagline: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  youtubeHandle: string | null;
  telegramHandle: string | null;
  storeType: string;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const [storeRes, categoriesRes, brandsRes] = await Promise.all([
          fetch(`/api/store/${slug}`),
          fetch(`/api/store/${slug}/categories`),
          fetch(`/api/store/${slug}/brands`),
        ]);

        if (!storeRes.ok) {
          const data = await storeRes.json();
          throw new Error(data.error || "Store not found");
        }

        const storeData = await storeRes.json();
        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();

        setStore(storeData.store);
        setCategories(categoriesData.categories || []);
        setBrands(brandsData.brands || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load store");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${slug}/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getWhatsAppLink = () => {
    if (!store?.whatsappNumber) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=Hi, I'm browsing your store at ${store.shopName}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <HiX className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Store Not Found
          </h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Bar */}
      <div className="bg-neutral-900 text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="hidden sm:block">
            Welcome to {store?.shopName || "Our Store"}
          </p>
          <div className="flex items-center gap-4">
            {store?.whatsappNumber && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-amber-400 transition-colors"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span className="hidden sm:inline">Contact Us</span>
              </a>
            )}
            <div className="flex items-center gap-3">
              {store?.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  <FaInstagram className="w-4 h-4" />
                </a>
              )}
              {store?.facebookHandle && (
                <a
                  href={`https://facebook.com/${store.facebookHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  <FaFacebookF className="w-4 h-4" />
                </a>
              )}
              {store?.youtubeHandle && (
                <a
                  href={`https://youtube.com/@${store.youtubeHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  <FaYoutube className="w-4 h-4" />
                </a>
              )}
              {store?.telegramHandle && (
                <a
                  href={`https://t.me/${store.telegramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  <FaTelegram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href={`/${slug}`} className="flex items-center gap-3">
              {store?.storeLogo ? (
                store.storeLogo.startsWith("data:") ? (
                  <img
                    src={store.storeLogo}
                    alt={store.shopName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <Image
                    src={store.storeLogo}
                    alt={store.shopName}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                )
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {store?.shopName?.charAt(0) || "S"}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-neutral-900">
                  {store?.shopName}
                </h1>
                {store?.tagline && (
                  <p className="text-xs text-neutral-500">
                    {store.tagline}
                  </p>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href={`/${slug}`}
                className={`font-medium transition-colors ${
                  pathname === `/${slug}`
                    ? "text-amber-600"
                    : "text-neutral-700 hover:text-amber-600"
                }`}
              >
                Home
              </Link>
              <Link
                href={`/${slug}/products`}
                className={`font-medium transition-colors ${
                  pathname.includes("/products")
                    ? "text-amber-600"
                    : "text-neutral-700 hover:text-amber-600"
                }`}
              >
                All Products
              </Link>
              <div className="relative group">
                <button className="font-medium text-neutral-700 hover:text-amber-600 transition-colors flex items-center gap-1">
                  Categories
                  <svg
                    className="w-4 h-4 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-80 overflow-y-auto">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${slug}/products?category=${category.id}`}
                        className="block px-4 py-2.5 text-neutral-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <span>{category.name}</span>
                        <span className="text-xs text-neutral-400 ml-2">
                          ({category.productCount})
                        </span>
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <p className="px-4 py-2 text-neutral-500 text-sm">
                        No categories yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button className="font-medium text-neutral-700 hover:text-amber-600 transition-colors flex items-center gap-1">
                  Brands
                  <svg
                    className="w-4 h-4 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-80 overflow-y-auto">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/${slug}/products?brand=${brand.id}`}
                        className="block px-4 py-2.5 text-neutral-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <span>{brand.name}</span>
                        <span className="text-xs text-neutral-400 ml-2">
                          ({brand.productCount})
                        </span>
                      </Link>
                    ))}
                    {brands.length === 0 && (
                      <p className="px-4 py-2 text-neutral-500 text-sm">
                        No brands yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-48 sm:w-64 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="ml-2 p-2 text-neutral-500 hover:text-neutral-700"
                    >
                      <HiX className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-neutral-600 hover:text-amber-600 transition-colors"
                  >
                    <HiOutlineSearch className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* WhatsApp CTA */}
              {store?.whatsappNumber && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  <span className="font-medium">Chat Now</span>
                </a>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-neutral-600"
              >
                {mobileMenuOpen ? (
                  <HiX className="w-6 h-6" />
                ) : (
                  <HiOutlineMenu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <Link
                href={`/${slug}`}
                className="block py-2 font-medium text-neutral-700 hover:text-amber-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href={`/${slug}/products`}
                className="block py-2 font-medium text-neutral-700 hover:text-amber-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Categories
                </p>
                <div className="space-y-1">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/${slug}/products?category=${category.id}`}
                      className="block py-1.5 text-neutral-600 hover:text-amber-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Brands
                </p>
                <div className="space-y-1">
                  {brands.slice(0, 6).map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/${slug}/products?brand=${brand.id}`}
                      className="block py-1.5 text-neutral-600 hover:text-amber-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              </div>
              {store?.whatsappNumber && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mt-4"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  <span className="font-medium">Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {store?.storeLogo ? (
                  store.storeLogo.startsWith("data:") ? (
                    <img
                      src={store.storeLogo}
                      alt={store.shopName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Image
                      src={store.storeLogo}
                      alt={store.shopName}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                  )
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">
                      {store?.shopName?.charAt(0) || "S"}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold">{store?.shopName}</h3>
              </div>
              <p className="text-neutral-400 text-sm mb-4">
                {store?.storeAddress || "Premium quality products at the best prices."}
              </p>
              <div className="flex items-center gap-4">
                {store?.instagramHandle && (
                  <a
                    href={`https://instagram.com/${store.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                )}
                {store?.facebookHandle && (
                  <a
                    href={`https://facebook.com/${store.facebookHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <FaFacebookF className="w-5 h-5" />
                  </a>
                )}
                {store?.youtubeHandle && (
                  <a
                    href={`https://youtube.com/@${store.youtubeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <FaYoutube className="w-5 h-5" />
                  </a>
                )}
                {store?.telegramHandle && (
                  <a
                    href={`https://t.me/${store.telegramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <FaTelegram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/${slug}`}
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${slug}/products`}
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    All Products
                  </Link>
                </li>
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/${slug}/products?category=${category.id}`}
                      className="text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <div className="space-y-3">
                {store?.whatsappNumber && (
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <FaWhatsapp className="w-5 h-5 text-green-500" />
                    <span>{store.whatsappNumber}</span>
                  </a>
                )}
                {store?.contactNumber && (
                  <a
                    href={`tel:${store.contactNumber}`}
                    className="flex items-center gap-3 text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{store.contactNumber}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-neutral-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {store?.shopName}. All rights reserved.</p>
            <p className="mt-2">
              Powered by{" "}
              <a
                href="https://myluxury.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400"
              >
                MyLuxury Network
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {store?.whatsappNumber && (
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
        >
          <FaWhatsapp className="w-7 h-7 text-white" />
        </a>
      )}
    </div>
  );
}
