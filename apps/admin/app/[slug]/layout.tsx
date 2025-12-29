"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTelegram,
  FaShoppingCart,
  FaTimes,
} from "react-icons/fa";
import { HiOutlineSearch, HiOutlineMenu, HiX } from "react-icons/hi";
import SocialProofNotifications from "./components/SocialProofNotifications";
import ExitIntentPopup from "./components/ExitIntentPopup";

// Cart item interface
interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

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
  brandCount: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface CartProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  brand: { name: string };
  images: string[];
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

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);

  // All products for social proof notifications
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category?: { name: string } }[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  // Show toast message
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const [storeRes, categoriesRes, brandsRes, productsRes] = await Promise.all([
          fetch(`/api/store/${slug}`),
          fetch(`/api/store/${slug}/categories`),
          fetch(`/api/store/${slug}/brands`),
          fetch(`/api/store/${slug}/products`),
        ]);

        if (!storeRes.ok) {
          const data = await storeRes.json();
          throw new Error(data.error || "Store not found");
        }

        const storeData = await storeRes.json();
        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();
        const productsData = await productsRes.json();

        setStore(storeData.store);
        setCategories(categoriesData.categories || []);
        setBrands(brandsData.brands || []);
        setAllProducts(productsData.products || []);
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

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem(`cart_${slug}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse cart:", e);
        }
      }
    }
  }, [slug]);

  // Listen for cart updates from products page (custom event for same-tab sync)
  useEffect(() => {
    const handleCartUpdate = (e: CustomEvent<{ slug: string; cart: CartItem[] }>) => {
      if (e.detail.slug === slug) {
        setCart(e.detail.cart);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `cart_${slug}` && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse cart from storage event:", err);
        }
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate as EventListener);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [slug]);

  // Fetch product details when cart opens
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (!cartOpen || cart.length === 0) return;

      const productIds = cart.map(item => item.productId);
      try {
        const res = await fetch(`/api/store/${slug}/products?ids=${productIds.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          setCartProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to fetch cart products:", err);
      }
    };

    fetchCartProducts();
  }, [cartOpen, cart, slug]);

  // Save cart to localStorage and dispatch event for sync
  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(newCart));
      // Dispatch custom event for same-tab sync
      window.dispatchEvent(new CustomEvent("cartUpdated", {
        detail: { slug, cart: newCart }
      }));
    }
  }, [slug]);

  // Cart handlers
  const handleRemoveFromCart = useCallback((productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    saveCart(newCart);
  }, [cart, saveCart]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      // Check stock before increasing quantity
      const product = cartProducts.find(p => p.id === productId);
      const currentItem = cart.find(item => item.productId === productId);
      const currentQty = currentItem?.quantity || 0;
      const maxQty = product?.stockQuantity || 0;

      // Only check stock when increasing quantity
      if (quantity > currentQty && quantity > maxQty) {
        showToast("You cannot add more quantity of this product at the moment");
        return;
      }

      const newCart = cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
      saveCart(newCart);
    }
  }, [cart, saveCart, handleRemoveFromCart, cartProducts, showToast]);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  // Cart calculations
  const cartItems = cart.map(item => {
    const product = cartProducts.find(p => p.id === item.productId);
    return { ...item, product };
  });

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.product?.sellingPrice || 0) * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate WhatsApp message for entire cart
  const getCartWhatsAppLink = useCallback(() => {
    if (!store?.whatsappNumber || cartItems.length === 0) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");
    const storeUrl = typeof window !== "undefined" ? window.location.origin : "";

    let message = `🛒 *Order Request*\n\n`;
    message += `━━━━━━━━━━━━━━━\n`;

    cartItems.forEach((item, index) => {
      if (item.product) {
        message += `${index + 1}. *${item.product.name}*\n`;
        message += `   SKU: ${item.product.sku}\n`;
        message += `   Qty: ${item.quantity} × ₹${item.product.sellingPrice.toLocaleString()}\n`;
        message += `   Subtotal: ₹${(item.product.sellingPrice * item.quantity).toLocaleString()}\n\n`;
      }
    });

    message += `━━━━━━━━━━━━━━━\n`;
    message += `*Total: ₹${cartTotal.toLocaleString()}*\n`;
    message += `*Items: ${cartItemCount}*\n\n`;
    message += `🏪 Store: @${slug}\n`;
    message += `🔗 ${storeUrl}/${slug}/products\n\n`;
    message += `Please confirm availability and share payment details.`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }, [store?.whatsappNumber, cartItems, cartTotal, cartItemCount, slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${slug}/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getWhatsAppLink = () => {
    if (!store?.whatsappNumber) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");
    return `https://api.whatsapp.com/send?phone=${phone}&text=Hi, I'm browsing your store at ${store.shopName}`;
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
                          ({category.brandCount} {category.brandCount === 1 ? "brand" : "brands"})
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

              {/* Cart Button - Always Visible */}
              <button
                onClick={() => setCartOpen(true)}
                className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                  cartItemCount > 0
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <FaShoppingCart className="w-5 h-5" />
                <span className="font-medium">Cart</span>
                {cartItemCount > 0 && (
                  <span className="bg-white text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px]">
                    {cartItemCount}
                  </span>
                )}
              </button>

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

      {/* Social Proof Notifications */}
      {allProducts.length > 0 && (
        <SocialProofNotifications products={allProducts} />
      )}

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        slug={slug}
        cart={cart}
        products={allProducts}
        whatsappNumber={store?.whatsappNumber}
      />

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

      {/* Mobile Cart Button - Always Visible */}
      <button
        onClick={() => setCartOpen(true)}
        className={`sm:hidden fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all ${
          cartItemCount > 0
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-neutral-200 hover:bg-neutral-300"
        }`}
      >
        <FaShoppingCart className={`w-6 h-6 ${cartItemCount > 0 ? "text-white" : "text-neutral-600"}`} />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-amber-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />

          {/* Cart Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <FaShoppingCart className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-lg">Your Cart</h2>
                <span className="bg-amber-100 text-amber-700 text-sm font-medium px-2 py-0.5 rounded-full">
                  {cartItemCount} items
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <FaShoppingCart className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500">Your cart is empty</p>
                  <Link
                    href={`/${slug}/products`}
                    onClick={() => setCartOpen(false)}
                    className="inline-block mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : cartProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-neutral-500">Loading cart items...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 p-3 bg-neutral-50 rounded-lg"
                    >
                      {/* Product Image */}
                      <Link
                        href={`/${slug}/product/${item.productId}`}
                        className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden"
                        onClick={() => setCartOpen(false)}
                      >
                        {item.product?.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-neutral-400 text-xs">No img</span>
                          </div>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${slug}/product/${item.productId}`}
                          onClick={() => setCartOpen(false)}
                        >
                          <h3 className="font-medium text-sm text-neutral-900 line-clamp-2 hover:text-amber-600">
                            {item.product?.name || "Loading..."}
                          </h3>
                        </Link>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.product?.brand.name}
                        </p>
                        <p className="text-amber-600 font-semibold mt-1">
                          {formatPrice(item.product?.sellingPrice || 0)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 text-neutral-700"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 text-neutral-700"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                            title="Remove from cart"
                          >
                            <FaTimes className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Total and Actions */}
            {cart.length > 0 && cartProducts.length > 0 && (
              <div className="border-t border-neutral-200 p-4 space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <a
                    href={getCartWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                    Order on WhatsApp
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={clearCart}
                      className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium text-sm"
                    >
                      Clear Cart
                    </button>
                    <Link
                      href={`/${slug}/products`}
                      onClick={() => setCartOpen(false)}
                      className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm text-center"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className="bg-neutral-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
