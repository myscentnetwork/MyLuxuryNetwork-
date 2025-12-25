import { NextResponse } from "next/server";
import prisma from "@/lib/db";

type PriceType = "wholesalePrice" | "resellerPrice" | "retailPrice";

// PATCH /api/products/[id]/wholesale-price - Update any price type with markup
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { markupType, markupValue, priceType = "wholesalePrice" } = body;

    // Validate price type
    const validPriceTypes: PriceType[] = ["wholesalePrice", "resellerPrice", "retailPrice"];
    if (!validPriceTypes.includes(priceType)) {
      return NextResponse.json({ error: "Invalid price type" }, { status: 400 });
    }

    // Get the product's cost price
    const product = await prisma.product.findUnique({
      where: { id },
      select: { costPrice: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate price based on markup type
    let calculatedPrice: number;

    if (markupType === "percentage") {
      // Price = Cost Price + (Cost Price * markupValue / 100)
      calculatedPrice = product.costPrice + (product.costPrice * markupValue / 100);
    } else {
      // Price = Cost Price + markupValue (fixed amount)
      calculatedPrice = product.costPrice + markupValue;
    }

    // Update the product with the specified price type
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { [priceType]: calculatedPrice },
      include: {
        category: true,
        brand: true,
        sizes: { include: { size: true } },
        images: { orderBy: { order: "asc" } },
        tags: true,
        colours: true,
      },
    });

    return NextResponse.json({
      ...updatedProduct,
      sizeIds: updatedProduct.sizes.map((s: { sizeId: string }) => s.sizeId),
      sizes: updatedProduct.sizes.map((s: { size: { id: string; name: string } }) => ({
        id: s.size.id,
        name: s.size.name,
      })),
      images: updatedProduct.images.map((i: { url: string }) => i.url),
      tags: updatedProduct.tags.map((t: { name: string }) => t.name),
      colours: updatedProduct.colours.map((c: { name: string }) => c.name),
      categoryName: updatedProduct.category.name,
      brandName: updatedProduct.brand.name,
    });
  } catch (error) {
    console.error("Error updating price:", error);
    return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
  }
}
