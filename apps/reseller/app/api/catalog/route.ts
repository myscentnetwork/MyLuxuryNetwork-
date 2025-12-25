import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// Get available products from admin catalog
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const resellerId = cookieStore.get("reseller_id")?.value;

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get reseller's selected categories
    const reseller = await prisma.reseller.findUnique({
      where: { id: resellerId },
      include: {
        selectedCategories: true,
        importedProducts: {
          select: { productId: true },
        },
      },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Reseller not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause - only products from reseller's selected categories
    const selectedCategoryIds = reseller.selectedCategories.map(
      (sc) => sc.categoryId
    );

    const where: any = {
      status: { not: "deleted" },
      categoryId: { in: selectedCategoryIds },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { order: "asc" },
            take: 1,
          },
          sizes: {
            include: { size: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Get already imported product IDs
    const importedProductIds = new Set(
      reseller.importedProducts.map((ip) => ip.productId)
    );

    // Transform products
    const transformedProducts = products.map((p) => ({
      id: p.id,
      name: p.name || p.sku,
      sku: p.sku,
      description: p.description,
      category: p.category.name,
      categoryId: p.categoryId,
      brand: p.brand.name,
      brandId: p.brandId,
      image: p.images[0]?.url || null,
      sizes: p.sizes.map((ps) => ps.size.name),
      status: p.status,
      isNew: p.isNewArrival,
      isFeatured: p.isFeatured,
      isImported: importedProductIds.has(p.id),
    }));

    // Get available categories and brands for filters
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: {
          id: { in: selectedCategoryIds },
          status: "active",
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.brand.findMany({
        where: {
          status: "active",
          categories: {
            some: {
              categoryId: { in: selectedCategoryIds },
            },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories,
        brands,
      },
    });
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
