import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const filter = searchParams.get("filter");
    const productId = searchParams.get("productId");

    // Find reseller by username
    const reseller = await prisma.reseller.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { id: username }, // Also allow lookup by ID
        ],
        status: "active",
      },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Fetch reseller's imported products with full product details
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
            tags: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // Transform products for the store frontend
    let products = importedProducts.map((rp) => ({
      id: rp.product.id,
      name: rp.product.name || rp.product.sku,
      sku: rp.product.sku,
      description: rp.product.description,
      price: rp.sellingPrice || 0, // Custom price set by reseller
      images: rp.product.images.map((img) => img.url),
      category: rp.product.category.name,
      categoryId: rp.product.categoryId,
      brand: rp.product.brand.name,
      brandLogo: rp.product.brand.logo,
      sizes: rp.product.sizes.map((ps) => ps.size.name),
      colours: rp.product.colours.map((c) => c.name),
      tags: rp.product.tags.map((t) => t.name),
      isNew: rp.product.isNewArrival,
      isFeatured: rp.product.isFeatured,
      isBestSeller: rp.product.isBestSeller,
      status: rp.product.status,
      isOutOfStock: rp.product.status === "out_of_stock",
    }));

    // If requesting a specific product
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ product });
    }

    // Get unique categories and brands from imported products (before filtering)
    const categories = [...new Set(products.map((p) => p.category))].sort();
    const brands = [...new Set(products.map((p) => p.brand))].sort();
    const totalProducts = products.length;

    // Calculate product counts before filtering
    const productCounts = {
      total: totalProducts,
      inStock: products.filter((p) => !p.isOutOfStock).length,
      new: products.filter((p) => p.isNew).length,
      featured: products.filter((p) => p.isFeatured).length,
    };

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

    return NextResponse.json({
      store: {
        id: reseller.id,
        username: reseller.username,
        storeName: reseller.shopName || reseller.name,
        logo: reseller.storeLogo,
        banner: reseller.storeBanner,
        whatsappNumber: reseller.whatsappNumber,
        contactNumber: reseller.contactNumber,
        email: reseller.email,
        storeAddress: reseller.storeAddress,
        socialLinks: {
          instagram: reseller.instagramHandle
            ? `https://instagram.com/${reseller.instagramHandle}`
            : null,
          facebook: null,
          twitter: null,
          linkedin: null,
        },
        categories,
        brands,
      },
      products,
      totalProducts,
      productCounts,
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
