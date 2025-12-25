import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/store/[username]/products - Get store's imported products
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");
    const brandId = searchParams.get("brand");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    if (!slug) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Find store and type
    let storeId: string | null = null;
    let storeType: string | null = null;

    const reseller = await prisma.reseller.findUnique({
      where: { username: slug },
      select: { id: true, status: true, registrationStatus: true },
    });

    if (reseller && reseller.status === "active" && reseller.registrationStatus === "approved") {
      storeId = reseller.id;
      storeType = "reseller";
    }

    if (!storeId) {
      const wholesaler = await prisma.wholesaler.findUnique({
        where: { username: slug },
        select: { id: true, status: true, registrationStatus: true },
      });

      if (wholesaler && wholesaler.status === "active" && wholesaler.registrationStatus === "approved") {
        storeId = wholesaler.id;
        storeType = "wholesaler";
      }
    }

    if (!storeId) {
      const retailer = await prisma.retailer.findUnique({
        where: { username: slug },
        select: { id: true, status: true, registrationStatus: true },
      });

      if (retailer && retailer.status === "active" && retailer.registrationStatus === "approved") {
        storeId = retailer.id;
        storeType = "retailer";
      }
    }

    if (!storeId || !storeType) {
      return NextResponse.json(
        { error: "Store not found or not active" },
        { status: 404 }
      );
    }

    // Build product filter
    const productFilter: Record<string, unknown> = {
      status: "in_stock",
    };

    if (categoryId) {
      productFilter.categoryId = categoryId;
    }

    if (brandId) {
      productFilter.brandId = brandId;
    }

    if (search) {
      productFilter.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (featured === "true") {
      productFilter.isFeatured = true;
    }

    // Fetch products based on store type
    let products: unknown[] = [];

    if (storeType === "reseller") {
      const resellerProducts = await prisma.resellerProduct.findMany({
        where: {
          resellerId: storeId,
          isVisible: true,
          product: productFilter,
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: { orderBy: { order: "asc" } },
              sizes: { include: { size: true } },
              colours: true,
            },
          },
        },
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
      });

      products = resellerProducts.map((item) => ({
        id: item.product.id,
        importId: item.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        mrp: item.product.mrp,
        sellingPrice: item.sellingPrice || item.product.resellerPrice,
        status: item.product.status,
        isFeatured: item.product.isFeatured,
        isNewArrival: item.product.isNewArrival,
        isBestSeller: item.product.isBestSeller,
        brand: item.product.brand,
        category: item.product.category,
        images: item.product.images.map((img) => img.url),
        sizes: item.product.sizes.map((s) => s.size.name),
        colours: item.product.colours.map((c) => c.name),
      }));
    } else if (storeType === "wholesaler") {
      const wholesalerProducts = await prisma.wholesalerProduct.findMany({
        where: {
          wholesalerId: storeId,
          isVisible: true,
          product: productFilter,
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: { orderBy: { order: "asc" } },
              sizes: { include: { size: true } },
              colours: true,
            },
          },
        },
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
      });

      products = wholesalerProducts.map((item) => ({
        id: item.product.id,
        importId: item.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        mrp: item.product.mrp,
        sellingPrice: item.sellingPrice || item.product.wholesalePrice,
        status: item.product.status,
        isFeatured: item.product.isFeatured,
        isNewArrival: item.product.isNewArrival,
        isBestSeller: item.product.isBestSeller,
        brand: item.product.brand,
        category: item.product.category,
        images: item.product.images.map((img) => img.url),
        sizes: item.product.sizes.map((s) => s.size.name),
        colours: item.product.colours.map((c) => c.name),
      }));
    } else if (storeType === "retailer") {
      const retailerProducts = await prisma.retailerProduct.findMany({
        where: {
          retailerId: storeId,
          isVisible: true,
          product: productFilter,
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: { orderBy: { order: "asc" } },
              sizes: { include: { size: true } },
              colours: true,
            },
          },
        },
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
      });

      products = retailerProducts.map((item) => ({
        id: item.product.id,
        importId: item.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        mrp: item.product.mrp,
        sellingPrice: item.sellingPrice || item.product.retailPrice,
        status: item.product.status,
        isFeatured: item.product.isFeatured,
        isNewArrival: item.product.isNewArrival,
        isBestSeller: item.product.isBestSeller,
        brand: item.product.brand,
        category: item.product.category,
        images: item.product.images.map((img) => img.url),
        sizes: item.product.sizes.map((s) => s.size.name),
        colours: item.product.colours.map((c) => c.name),
      }));
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
