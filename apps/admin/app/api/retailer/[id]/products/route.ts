import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/retailer/[id]/products - Get retailer's imported products
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const products = await prisma.retailerProduct.findMany({
      where: { retailerId: id },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            images: { orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = products.map((item) => ({
      id: item.id,
      productId: item.productId,
      sellingPrice: item.sellingPrice,
      isVisible: item.isVisible,
      displayOrder: item.displayOrder,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        mrp: item.product.mrp,
        retailPrice: item.product.retailPrice,
        resellerPrice: item.product.resellerPrice,
        wholesalePrice: item.product.wholesalePrice,
        status: item.product.status,
        brandName: item.product.brand.name,
        categoryName: item.product.category.name,
        images: item.product.images.map((img) => img.url),
      },
    }));

    return NextResponse.json({ products: transformed });
  } catch (error) {
    console.error("Error fetching retailer products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/retailer/[id]/products - Import a product
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { productId, sellingPrice, markupType, markupValue } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if already imported
    const existing = await prisma.retailerProduct.findUnique({
      where: {
        retailerId_productId: {
          retailerId: id,
          productId: productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already imported to your store" },
        { status: 400 }
      );
    }

    // Get the product to calculate selling price if markup is provided
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Calculate final selling price
    let finalSellingPrice = sellingPrice;
    const basePrice = product.retailPrice;

    if (markupType && markupValue) {
      if (markupType === "percentage") {
        finalSellingPrice = basePrice + (basePrice * markupValue / 100);
      } else if (markupType === "fixed") {
        finalSellingPrice = basePrice + markupValue;
      }
    }

    // Create the import
    const imported = await prisma.retailerProduct.create({
      data: {
        retailerId: id,
        productId: productId,
        sellingPrice: finalSellingPrice || null,
        isVisible: true,
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            images: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: imported.id,
        productId: imported.productId,
        sellingPrice: imported.sellingPrice,
        isVisible: imported.isVisible,
        product: {
          id: imported.product.id,
          name: imported.product.name,
          sku: imported.product.sku,
          mrp: imported.product.mrp,
          retailPrice: imported.product.retailPrice,
          status: imported.product.status,
          brandName: imported.product.brand.name,
          categoryName: imported.product.category.name,
          images: imported.product.images.map((img) => img.url),
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error importing product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to import product: ${errorMessage}` },
      { status: 500 }
    );
  }
}
