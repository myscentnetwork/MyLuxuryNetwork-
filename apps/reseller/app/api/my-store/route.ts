import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

// GET - Fetch reseller's imported products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resellerId = searchParams.get("resellerId");

    if (!resellerId) {
      return NextResponse.json(
        { error: "Reseller ID is required" },
        { status: 400 }
      );
    }

    const importedProducts = await prisma.resellerProduct.findMany({
      where: {
        resellerId,
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

    return NextResponse.json({
      products: importedProducts.map((rp) => ({
        id: rp.product.id,
        name: rp.product.name,
        sku: rp.product.sku,
        description: rp.product.description,
        sellingPrice: rp.sellingPrice,
        status: rp.product.status,
        isFeatured: rp.product.isFeatured,
        isNewArrival: rp.product.isNewArrival,
        category: rp.product.category.name,
        brand: rp.product.brand.name,
        brandLogo: rp.product.brand.logo,
        images: rp.product.images.map((img) => img.url),
        sizes: rp.product.sizes.map((ps) => ps.size.name),
        colours: rp.product.colours.map((c) => c.name),
        tags: rp.product.tags.map((t) => t.name),
      })),
      productIds: importedProducts.map((rp) => rp.productId),
    });
  } catch (error) {
    console.error("Error fetching imported products:", error);
    return NextResponse.json(
      { error: "Failed to fetch imported products" },
      { status: 500 }
    );
  }
}

// POST - Import a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resellerId, productId, sellingPrice } = body;

    if (!resellerId || !productId) {
      return NextResponse.json(
        { error: "Reseller ID and Product ID are required" },
        { status: 400 }
      );
    }

    // Check if already imported
    const existing = await prisma.resellerProduct.findUnique({
      where: {
        resellerId_productId: {
          resellerId,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already imported" },
        { status: 400 }
      );
    }

    // Get highest display order
    const lastProduct = await prisma.resellerProduct.findFirst({
      where: { resellerId },
      orderBy: { displayOrder: "desc" },
    });

    const resellerProduct = await prisma.resellerProduct.create({
      data: {
        resellerId,
        productId,
        sellingPrice: sellingPrice || null,
        displayOrder: (lastProduct?.displayOrder || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, resellerProduct });
  } catch (error) {
    console.error("Error importing product:", error);
    return NextResponse.json(
      { error: "Failed to import product" },
      { status: 500 }
    );
  }
}

// DELETE - Remove imported product
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resellerId = searchParams.get("resellerId");
    const productId = searchParams.get("productId");

    if (!resellerId || !productId) {
      return NextResponse.json(
        { error: "Reseller ID and Product ID are required" },
        { status: 400 }
      );
    }

    await prisma.resellerProduct.delete({
      where: {
        resellerId_productId: {
          resellerId,
          productId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing product:", error);
    return NextResponse.json(
      { error: "Failed to remove product" },
      { status: 500 }
    );
  }
}
