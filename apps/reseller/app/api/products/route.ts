import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// Helper to get reseller from cookie
async function getResellerId() {
  const cookieStore = await cookies();
  return cookieStore.get("reseller_id")?.value;
}

// GET /api/products - Get reseller's imported products
export async function GET(request: NextRequest) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const visibility = searchParams.get("visibility"); // all, visible, hidden

    // Build where clause
    const where: any = {
      resellerId,
    };

    if (visibility === "visible") {
      where.isVisible = true;
    } else if (visibility === "hidden") {
      where.isVisible = false;
    }

    // Get imported products
    const importedProducts = await prisma.resellerProduct.findMany({
      where,
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

    // Apply additional filters and transform
    let products = importedProducts.map((rp) => ({
      id: rp.id,
      productId: rp.product.id,
      name: rp.product.name || rp.product.sku,
      sku: rp.product.sku,
      description: rp.product.description,
      category: rp.product.category.name,
      categoryId: rp.product.categoryId,
      brand: rp.product.brand.name,
      brandId: rp.product.brandId,
      brandLogo: rp.product.brand.logo,
      images: rp.product.images.map((img) => img.url),
      sizes: rp.product.sizes.map((ps) => ({ id: ps.size.id, name: ps.size.name })),
      colours: rp.product.colours.map((c) => c.name),
      tags: rp.product.tags.map((t) => t.name),
      status: rp.product.status,
      isNew: rp.product.isNewArrival,
      isFeatured: rp.product.isFeatured,
      isBestSeller: rp.product.isBestSeller,
      // Reseller-specific fields
      sellingPrice: rp.sellingPrice,
      isVisible: rp.isVisible,
      displayOrder: rp.displayOrder,
    }));

    // Apply category/brand filters
    if (categoryId) {
      products = products.filter((p) => p.categoryId === categoryId);
    }

    if (brandId) {
      products = products.filter((p) => p.brandId === brandId);
    }

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Import products from catalog
export async function POST(request: NextRequest) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productIds, sellingPrice } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs are required" },
        { status: 400 }
      );
    }

    // Get current max display order
    const maxOrderProduct = await prisma.resellerProduct.findFirst({
      where: { resellerId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    let displayOrder = (maxOrderProduct?.displayOrder || 0) + 1;

    // Import products (skip already imported ones)
    const results = await Promise.all(
      productIds.map(async (productId: string) => {
        try {
          const existing = await prisma.resellerProduct.findUnique({
            where: {
              resellerId_productId: {
                resellerId,
                productId,
              },
            },
          });

          if (existing) {
            return { productId, status: "already_imported" };
          }

          await prisma.resellerProduct.create({
            data: {
              resellerId,
              productId,
              sellingPrice: sellingPrice || null,
              isVisible: true,
              displayOrder: displayOrder++,
            },
          });

          return { productId, status: "imported" };
        } catch (err) {
          return { productId, status: "error" };
        }
      })
    );

    const imported = results.filter((r) => r.status === "imported").length;
    const alreadyImported = results.filter(
      (r) => r.status === "already_imported"
    ).length;

    return NextResponse.json({
      success: true,
      imported,
      alreadyImported,
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}
