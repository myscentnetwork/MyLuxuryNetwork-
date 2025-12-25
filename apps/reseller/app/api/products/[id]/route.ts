import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// Helper to get reseller from cookie
async function getResellerId() {
  const cookieStore = await cookies();
  return cookieStore.get("reseller_id")?.value;
}

// GET /api/products/[id] - Get single imported product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const resellerProduct = await prisma.resellerProduct.findFirst({
      where: {
        id,
        resellerId,
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
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: resellerProduct.id,
      productId: resellerProduct.product.id,
      name: resellerProduct.product.name || resellerProduct.product.sku,
      sku: resellerProduct.product.sku,
      description: resellerProduct.product.description,
      category: resellerProduct.product.category.name,
      categoryId: resellerProduct.product.categoryId,
      brand: resellerProduct.product.brand.name,
      brandId: resellerProduct.product.brandId,
      brandLogo: resellerProduct.product.brand.logo,
      images: resellerProduct.product.images.map((img) => img.url),
      sizes: resellerProduct.product.sizes.map((ps) => ({
        id: ps.size.id,
        name: ps.size.name,
      })),
      colours: resellerProduct.product.colours.map((c) => c.name),
      tags: resellerProduct.product.tags.map((t) => t.name),
      status: resellerProduct.product.status,
      isNew: resellerProduct.product.isNewArrival,
      isFeatured: resellerProduct.product.isFeatured,
      isBestSeller: resellerProduct.product.isBestSeller,
      sellingPrice: resellerProduct.sellingPrice,
      isVisible: resellerProduct.isVisible,
      displayOrder: resellerProduct.displayOrder,
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update imported product (price, visibility, order)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.resellerProduct.findFirst({
      where: {
        id,
        resellerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updateData: any = {};

    if (body.sellingPrice !== undefined) {
      updateData.sellingPrice = body.sellingPrice;
    }

    if (body.isVisible !== undefined) {
      updateData.isVisible = body.isVisible;
    }

    if (body.displayOrder !== undefined) {
      updateData.displayOrder = body.displayOrder;
    }

    const updated = await prisma.resellerProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Remove product from reseller's catalog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.resellerProduct.findFirst({
      where: {
        id,
        resellerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.resellerProduct.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from catalog",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
