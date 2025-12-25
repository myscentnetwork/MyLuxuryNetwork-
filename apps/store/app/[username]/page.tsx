import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import StoreSidebar from "@/components/StoreSidebar";
import ProductsSection from "@/components/ProductsSection";
import { prisma } from "@repo/database";

interface StoreData {
  store: {
    id: string;
    username: string | null;
    storeName: string;
    logo: string | null;
    banner: string | null;
    whatsappNumber: string | null;
    socialLinks: {
      instagram: string | null;
      facebook: string | null;
      twitter: string | null;
    };
    categories: string[];
    brands: string[];
  };
  products: Product[];
  totalProducts: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  images: string[];
  category: string;
  brand: string;
  brandLogo: string | null;
  sizes: string[];
  colours: string[];
  isNew: boolean;
  isFeatured: boolean;
  status: string;
  isOutOfStock: boolean;
}

async function getStoreData(username: string, category?: string, brand?: string, filter?: string): Promise<StoreData | null> {
  try {
    // Find reseller by username
    const reseller = await prisma.reseller.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { id: username },
        ],
        status: "active",
      },
    });

    if (!reseller) {
      return null;
    }

    // Fetch reseller's imported products
    const importedProducts = await prisma.resellerProduct.findMany({
      where: {
        resellerId: reseller.id,
        isVisible: true,
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            images: {
              orderBy: { order: "asc" },
            },
            sizes: {
              include: { size: true },
            },
            colours: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // Transform products
    let products: Product[] = importedProducts.map((rp) => ({
      id: rp.product.id,
      name: rp.product.name || rp.product.sku,
      sku: rp.product.sku,
      description: rp.product.description,
      price: rp.sellingPrice || 0,
      images: rp.product.images.map((img) => img.url),
      category: rp.product.category.name,
      brand: rp.product.brand.name,
      brandLogo: rp.product.brand.logo,
      sizes: rp.product.sizes.map((ps) => ps.size.name),
      colours: rp.product.colours.map((c) => c.name),
      isNew: rp.product.isNewArrival,
      isFeatured: rp.product.isFeatured,
      status: rp.product.status,
      isOutOfStock: rp.product.status === "out_of_stock",
    }));

    // Get unique categories and brands (before filtering)
    const categories = [...new Set(products.map((p) => p.category))].sort();
    const brands = [...new Set(products.map((p) => p.brand))].sort();

    // Apply filters
    if (category) {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (brand) {
      products = products.filter(
        (p) => p.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    if (filter === "new") {
      products = products.filter((p) => p.isNew);
    } else if (filter === "featured") {
      products = products.filter((p) => p.isFeatured);
    } else if (filter === "in_stock") {
      products = products.filter((p) => !p.isOutOfStock);
    }

    return {
      store: {
        id: reseller.id,
        username: reseller.username,
        storeName: reseller.shopName || reseller.name,
        logo: reseller.storeLogo,
        banner: reseller.storeBanner,
        whatsappNumber: reseller.whatsappNumber,
        socialLinks: {
          instagram: reseller.instagramHandle
            ? `https://instagram.com/${reseller.instagramHandle}`
            : null,
          facebook: null,
          twitter: null,
        },
        categories,
        brands,
      },
      products,
      totalProducts: products.length,
    };
  } catch (error) {
    console.error("Error fetching store data:", error);
    return null;
  }
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ category?: string; brand?: string; filter?: string }>;
}) {
  const { username } = await params;
  const { category, brand, filter } = await searchParams;

  const data = await getStoreData(username, category, brand, filter);

  if (!data) {
    notFound();
  }

  const { store, products } = data;
  const hasFilters = category || brand || filter;

  return (
    <>
      <StoreHeader
        storeName={store.storeName}
        username={username}
        logo={store.logo || undefined}
        categories={store.categories}
      />

      <main className="flex-1">
        {/* Hero Section - Only on home page */}
        {!hasFilters && (
          <section className="relative bg-gradient-to-br from-luxury-black via-luxury-dark to-luxury-black py-12 md:py-20">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-luxury-gold/5 via-transparent to-luxury-gold/5"></div>
            <div className="max-w-7xl mx-auto px-4 relative">
              <div className="text-center">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">
                  Welcome to{" "}
                  <span className="text-luxury-gold">{store.storeName}</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
                  Browse our curated collection of premium luxury products.
                  Enquire via WhatsApp to order.
                </p>

                {/* Catalog Notice */}
                <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 rounded-full px-4 py-2 mb-8">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-green-400 text-sm font-medium">Order via WhatsApp</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-luxury-gold font-bold text-2xl">{products.length}</p>
                    <p className="text-gray-500 text-xs">Products</p>
                  </div>
                  <div className="text-center border-x border-luxury-gray/30">
                    <p className="text-luxury-gold font-bold text-2xl">{store.categories.length}</p>
                    <p className="text-gray-500 text-xs">Categories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-luxury-gold font-bold text-2xl">{store.brands.length}</p>
                    <p className="text-gray-500 text-xs">Brands</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content with Sidebar */}
        <section id="products" className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar - Hidden on mobile, shown on desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <StoreSidebar
                  categories={store.categories}
                  brands={store.brands}
                  username={username}
                  currentCategory={category}
                  currentBrand={brand}
                  currentFilter={filter}
                  productCounts={{
                    total: data.totalProducts,
                    inStock: products.filter(p => !p.isOutOfStock).length,
                    new: products.filter(p => p.isNew).length,
                    featured: products.filter(p => p.isFeatured).length,
                  }}
                />
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                <ProductsSection
                  products={products}
                  username={username}
                  whatsappNumber={store.whatsappNumber || undefined}
                  categories={store.categories}
                  brands={store.brands}
                  currentCategory={category}
                  currentBrand={brand}
                  currentFilter={filter}
                  productCounts={{
                    total: data.totalProducts,
                    inStock: products.filter((p) => !p.isOutOfStock).length,
                    new: products.filter((p) => p.isNew).length,
                    featured: products.filter((p) => p.isFeatured).length,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* How to Order Section */}
        <section className="py-12 bg-luxury-dark/50 border-t border-luxury-gray/30">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-white text-center mb-8">
              How to Order
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-luxury-gold font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Browse Products</h3>
                <p className="text-gray-500 text-sm">Explore our catalog and find products you love</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-luxury-gold font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Click Enquire</h3>
                <p className="text-gray-500 text-sm">Tap the WhatsApp button on any product</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-luxury-gold font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Place Order</h3>
                <p className="text-gray-500 text-sm">Chat with us to confirm and complete your order</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-10 border-t border-luxury-gray/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-luxury-gold text-2xl mb-2">✓</div>
                <h4 className="font-medium text-white text-sm">100% Authentic</h4>
              </div>
              <div>
                <div className="text-luxury-gold text-2xl mb-2">🚚</div>
                <h4 className="font-medium text-white text-sm">Fast Delivery</h4>
              </div>
              <div>
                <div className="text-luxury-gold text-2xl mb-2">💬</div>
                <h4 className="font-medium text-white text-sm">WhatsApp Support</h4>
              </div>
              <div>
                <div className="text-luxury-gold text-2xl mb-2">🔒</div>
                <h4 className="font-medium text-white text-sm">Secure Payment</h4>
              </div>
            </div>
          </div>
        </section>
      </main>

      <StoreFooter
        storeName={store.storeName}
        username={username}
        socialLinks={{
          instagram: store.socialLinks.instagram || undefined,
          facebook: store.socialLinks.facebook || undefined,
          twitter: store.socialLinks.twitter || undefined,
        }}
        whatsappNumber={store.whatsappNumber || undefined}
      />
    </>
  );
}
