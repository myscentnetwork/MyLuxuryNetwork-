import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@repo/database";

interface ProductData {
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

interface StoreInfo {
  id: string;
  storeName: string;
  logo: string | null;
  whatsappNumber: string | null;
  socialLinks: {
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
  };
  categories: string[];
}

async function getProductData(
  username: string,
  productId: string
): Promise<{ store: StoreInfo; product: ProductData; relatedProducts: ProductData[] } | null> {
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

    // Fetch the specific product from reseller's imported products
    const resellerProduct = await prisma.resellerProduct.findFirst({
      where: {
        resellerId: reseller.id,
        productId: productId,
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
            tags: true,
          },
        },
      },
    });

    if (!resellerProduct) {
      return null;
    }

    const product: ProductData = {
      id: resellerProduct.product.id,
      name: resellerProduct.product.name || resellerProduct.product.sku,
      sku: resellerProduct.product.sku,
      description: resellerProduct.product.description,
      price: resellerProduct.sellingPrice || 0,
      images: resellerProduct.product.images.map((img) => img.url),
      category: resellerProduct.product.category.name,
      brand: resellerProduct.product.brand.name,
      brandLogo: resellerProduct.product.brand.logo,
      sizes: resellerProduct.product.sizes.map((ps) => ps.size.name),
      colours: resellerProduct.product.colours.map((c) => c.name),
      isNew: resellerProduct.product.isNewArrival,
      isFeatured: resellerProduct.product.isFeatured,
      status: resellerProduct.product.status,
      isOutOfStock: resellerProduct.product.status === "out_of_stock",
    };

    // Fetch related products (same category, different product)
    const relatedResellerProducts = await prisma.resellerProduct.findMany({
      where: {
        resellerId: reseller.id,
        isVisible: true,
        productId: { not: productId },
        product: {
          categoryId: resellerProduct.product.categoryId,
        },
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            images: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
      take: 4,
    });

    const relatedProducts: ProductData[] = relatedResellerProducts.map((rp) => ({
      id: rp.product.id,
      name: rp.product.name || rp.product.sku,
      sku: rp.product.sku,
      description: rp.product.description,
      price: rp.sellingPrice || 0,
      images: rp.product.images.map((img) => img.url),
      category: rp.product.category.name,
      brand: rp.product.brand.name,
      brandLogo: rp.product.brand.logo,
      sizes: [],
      colours: [],
      isNew: rp.product.isNewArrival,
      isFeatured: rp.product.isFeatured,
      status: rp.product.status,
      isOutOfStock: rp.product.status === "out_of_stock",
    }));

    // Get all categories from reseller's products
    const allProducts = await prisma.resellerProduct.findMany({
      where: { resellerId: reseller.id, isVisible: true },
      include: { product: { include: { category: true } } },
    });
    const categories = [...new Set(allProducts.map((p) => p.product.category.name))].sort();

    return {
      store: {
        id: reseller.id,
        storeName: reseller.shopName || reseller.name,
        logo: reseller.storeLogo,
        whatsappNumber: reseller.whatsappNumber,
        socialLinks: {
          instagram: reseller.instagramHandle
            ? `https://instagram.com/${reseller.instagramHandle}`
            : null,
          facebook: null,
          twitter: null,
        },
        categories,
      },
      product,
      relatedProducts,
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}): Promise<Metadata> {
  const { username, id } = await params;
  const data = await getProductData(username, id);

  if (!data) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${data.product.name} | ${data.store.storeName}`,
    description: data.product.description?.slice(0, 160) || `Shop ${data.product.name} at ${data.store.storeName}`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;
  const data = await getProductData(username, id);

  if (!data) {
    notFound();
  }

  const { store, product, relatedProducts } = data;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in this product:\n\n*${product.name}*\nSKU: ${product.sku}\nPrice: ${formatPrice(product.price)}\n\nPlease share more details.`
  );

  return (
    <>
      <StoreHeader
        storeName={store.storeName}
        username={username}
        logo={store.logo || undefined}
        categories={store.categories}
      />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href={`/${username}`}
                className="text-gray-500 hover:text-luxury-gold transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li>
              <Link
                href={`/${username}?category=${encodeURIComponent(product.category)}`}
                className="text-gray-500 hover:text-luxury-gold transition-colors"
              >
                {product.category}
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li className="text-luxury-gold truncate max-w-[200px]">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Detail Section */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-luxury-dark rounded-xl overflow-hidden border border-luxury-gray/30">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-luxury-gray/20">
                    <span className="text-gray-500 text-6xl">📦</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-luxury-gold text-luxury-black text-xs font-bold px-3 py-1 rounded">
                      NEW
                    </span>
                  )}
                </div>

                {product.isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white font-bold px-6 py-3 rounded-lg text-lg">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-luxury-gray/30 hover:border-luxury-gold transition-colors"
                    >
                      <img
                        src={img}
                        alt={`${product.name} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand & Category */}
              <div className="flex items-center gap-3">
                <span className="text-luxury-gold font-semibold uppercase tracking-wide">
                  {product.brand}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500">{product.category}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
                {product.name}
              </h1>

              {/* SKU */}
              <p className="text-gray-500 text-sm">SKU: {product.sku}</p>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-luxury-gold font-bold text-3xl">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t border-b border-luxury-gray/30 py-6">
                  <p className="text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                {/* Colors */}
                {product.colours && product.colours.length > 0 && (
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colours.map((color) => (
                        <button
                          key={color}
                          className="px-4 py-2 border border-luxury-gray/50 rounded-lg text-gray-400 hover:border-luxury-gold hover:text-luxury-gold transition-colors text-sm"
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          className="px-4 py-2 border border-luxury-gray/50 rounded-lg text-gray-400 hover:border-luxury-gold hover:text-luxury-gold transition-colors text-sm"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {store.whatsappNumber && (
                  <a
                    href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg transition-all ${
                      product.isOutOfStock
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {product.isOutOfStock ? "Out of Stock" : "Order on WhatsApp"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-luxury-dark/50 border-t border-luxury-gray/30">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="font-serif text-2xl font-bold text-white mb-6">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    id={relatedProduct.id}
                    name={relatedProduct.name}
                    sku={relatedProduct.sku}
                    price={relatedProduct.price}
                    image={relatedProduct.images[0] || ""}
                    category={relatedProduct.category}
                    brand={relatedProduct.brand}
                    username={username}
                    isNew={relatedProduct.isNew}
                    isFeatured={relatedProduct.isFeatured}
                    isOutOfStock={relatedProduct.isOutOfStock}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
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
