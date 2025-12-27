import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// Get user info from cookies
async function getUserFromCookies() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  const userType = cookieStore.get("user_type")?.value;

  return { userId, userType };
}

// PATCH - Update imported product (selling price, visibility)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userType } = await getUserFromCookies();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sellingPrice, isVisible } = body;

    // Get the appropriate model based on user type
    let importedProduct;
    let product;

    if (userType === "reseller") {
      importedProduct = await prisma.resellerProduct.findFirst({
        where: {
          id,
          resellerId: userId,
        },
        include: {
          product: {
            select: {
              retailPrice: true,
              mrp: true,
            },
          },
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      product = importedProduct.product;

      // Validate selling price is not less than minimum selling price
      if (sellingPrice !== undefined && sellingPrice < product.retailPrice) {
        return NextResponse.json(
          { error: `Selling price cannot be less than Minimum Selling Price (₹${product.retailPrice})` },
          { status: 400 }
        );
      }

      // Validate selling price is not more than MRP
      if (sellingPrice !== undefined && sellingPrice > product.mrp) {
        return NextResponse.json(
          { error: `Selling price cannot exceed MRP (₹${product.mrp})` },
          { status: 400 }
        );
      }

      const updateData: { sellingPrice?: number; isVisible?: boolean } = {};
      if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice;
      if (isVisible !== undefined) updateData.isVisible = isVisible;

      const updated = await prisma.resellerProduct.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, product: updated });
    } else if (userType === "wholesaler") {
      importedProduct = await prisma.wholesalerProduct.findFirst({
        where: {
          id,
          wholesalerId: userId,
        },
        include: {
          product: {
            select: {
              retailPrice: true,
              mrp: true,
            },
          },
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      product = importedProduct.product;

      // Validate selling price is not less than minimum selling price
      if (sellingPrice !== undefined && sellingPrice < product.retailPrice) {
        return NextResponse.json(
          { error: `Selling price cannot be less than Minimum Selling Price (₹${product.retailPrice})` },
          { status: 400 }
        );
      }

      // Validate selling price is not more than MRP
      if (sellingPrice !== undefined && sellingPrice > product.mrp) {
        return NextResponse.json(
          { error: `Selling price cannot exceed MRP (₹${product.mrp})` },
          { status: 400 }
        );
      }

      const updateData: { sellingPrice?: number; isVisible?: boolean } = {};
      if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice;
      if (isVisible !== undefined) updateData.isVisible = isVisible;

      const updated = await prisma.wholesalerProduct.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, product: updated });
    } else if (userType === "retailer") {
      importedProduct = await prisma.retailerProduct.findFirst({
        where: {
          id,
          retailerId: userId,
        },
        include: {
          product: {
            select: {
              retailPrice: true,
              mrp: true,
            },
          },
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      product = importedProduct.product;

      // Validate selling price is not less than minimum selling price
      if (sellingPrice !== undefined && sellingPrice < product.retailPrice) {
        return NextResponse.json(
          { error: `Selling price cannot be less than Minimum Selling Price (₹${product.retailPrice})` },
          { status: 400 }
        );
      }

      // Validate selling price is not more than MRP
      if (sellingPrice !== undefined && sellingPrice > product.mrp) {
        return NextResponse.json(
          { error: `Selling price cannot exceed MRP (₹${product.mrp})` },
          { status: 400 }
        );
      }

      const updateData: { sellingPrice?: number; isVisible?: boolean } = {};
      if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice;
      if (isVisible !== undefined) updateData.isVisible = isVisible;

      const updated = await prisma.retailerProduct.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, product: updated });
    }

    return NextResponse.json(
      { error: "Invalid user type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating imported product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Remove imported product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userType } = await getUserFromCookies();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the appropriate model based on user type
    if (userType === "reseller") {
      const importedProduct = await prisma.resellerProduct.findFirst({
        where: {
          id,
          resellerId: userId,
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      await prisma.resellerProduct.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } else if (userType === "wholesaler") {
      const importedProduct = await prisma.wholesalerProduct.findFirst({
        where: {
          id,
          wholesalerId: userId,
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      await prisma.wholesalerProduct.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } else if (userType === "retailer") {
      const importedProduct = await prisma.retailerProduct.findFirst({
        where: {
          id,
          retailerId: userId,
        },
      });

      if (!importedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      await prisma.retailerProduct.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid user type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting imported product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
