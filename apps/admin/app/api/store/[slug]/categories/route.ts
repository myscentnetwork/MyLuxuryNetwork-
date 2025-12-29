import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/store/[username]/categories - Get store's categories (from imported products)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    // Get unique categories from imported products
    let categoryIds: string[] = [];

    if (storeType === "reseller") {
      const products = await prisma.resellerProduct.findMany({
        where: { resellerId: storeId, isVisible: true },
        include: { product: { select: { categoryId: true } } },
      });
      categoryIds = [...new Set(products.map((p) => p.product.categoryId))];
    } else if (storeType === "wholesaler") {
      const products = await prisma.wholesalerProduct.findMany({
        where: { wholesalerId: storeId, isVisible: true },
        include: { product: { select: { categoryId: true } } },
      });
      categoryIds = [...new Set(products.map((p) => p.product.categoryId))];
    } else if (storeType === "retailer") {
      const products = await prisma.retailerProduct.findMany({
        where: { retailerId: storeId, isVisible: true },
        include: { product: { select: { categoryId: true } } },
      });
      categoryIds = [...new Set(products.map((p) => p.product.categoryId))];
    }

    // Get category details
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        status: "active",
      },
      select: {
        id: true,
        name: true,
        logo: true,
      },
      orderBy: { name: "asc" },
    });

    // Get brand count per category (count distinct brands in each category)
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        let brandIds: string[] = [];

        if (storeType === "reseller") {
          const products = await prisma.resellerProduct.findMany({
            where: {
              resellerId: storeId,
              isVisible: true,
              product: { categoryId: category.id, status: "in_stock" },
            },
            include: { product: { select: { brandId: true } } },
          });
          brandIds = [...new Set(products.map((p) => p.product.brandId))];
        } else if (storeType === "wholesaler") {
          const products = await prisma.wholesalerProduct.findMany({
            where: {
              wholesalerId: storeId,
              isVisible: true,
              product: { categoryId: category.id, status: "in_stock" },
            },
            include: { product: { select: { brandId: true } } },
          });
          brandIds = [...new Set(products.map((p) => p.product.brandId))];
        } else if (storeType === "retailer") {
          const products = await prisma.retailerProduct.findMany({
            where: {
              retailerId: storeId,
              isVisible: true,
              product: { categoryId: category.id, status: "in_stock" },
            },
            include: { product: { select: { brandId: true } } },
          });
          brandIds = [...new Set(products.map((p) => p.product.brandId))];
        }

        return { ...category, brandCount: brandIds.length };
      })
    );

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error("Error fetching store categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
