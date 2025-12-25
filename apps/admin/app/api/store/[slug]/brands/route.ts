import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/store/[username]/brands - Get store's brands (from imported products)
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

    // Get unique brands from imported products
    let brandIds: string[] = [];

    if (storeType === "reseller") {
      const products = await prisma.resellerProduct.findMany({
        where: { resellerId: storeId, isVisible: true },
        include: { product: { select: { brandId: true } } },
      });
      brandIds = [...new Set(products.map((p) => p.product.brandId))];
    } else if (storeType === "wholesaler") {
      const products = await prisma.wholesalerProduct.findMany({
        where: { wholesalerId: storeId, isVisible: true },
        include: { product: { select: { brandId: true } } },
      });
      brandIds = [...new Set(products.map((p) => p.product.brandId))];
    } else if (storeType === "retailer") {
      const products = await prisma.retailerProduct.findMany({
        where: { retailerId: storeId, isVisible: true },
        include: { product: { select: { brandId: true } } },
      });
      brandIds = [...new Set(products.map((p) => p.product.brandId))];
    }

    // Get brand details
    const brands = await prisma.brand.findMany({
      where: {
        id: { in: brandIds },
        status: "active",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
      orderBy: { name: "asc" },
    });

    // Get product count per brand
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        let count = 0;

        if (storeType === "reseller") {
          count = await prisma.resellerProduct.count({
            where: {
              resellerId: storeId,
              isVisible: true,
              product: { brandId: brand.id, status: "in_stock" },
            },
          });
        } else if (storeType === "wholesaler") {
          count = await prisma.wholesalerProduct.count({
            where: {
              wholesalerId: storeId,
              isVisible: true,
              product: { brandId: brand.id, status: "in_stock" },
            },
          });
        } else if (storeType === "retailer") {
          count = await prisma.retailerProduct.count({
            where: {
              retailerId: storeId,
              isVisible: true,
              product: { brandId: brand.id, status: "in_stock" },
            },
          });
        }

        return { ...brand, productCount: count };
      })
    );

    return NextResponse.json({ brands: brandsWithCount });
  } catch (error) {
    console.error("Error fetching store brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
