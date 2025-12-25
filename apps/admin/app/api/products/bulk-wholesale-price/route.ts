import { NextResponse } from "next/server";
import prisma from "@/lib/db";

type PriceType = "wholesalePrice" | "resellerPrice" | "retailPrice";

// POST /api/products/bulk-wholesale-price - Update any price type for all products with markup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { markupType, markupValue, priceType = "wholesalePrice" } = body;

    if (!markupType || markupValue === undefined || markupValue === null) {
      return NextResponse.json(
        { error: "markupType and markupValue are required" },
        { status: 400 }
      );
    }

    // Validate price type
    const validPriceTypes: PriceType[] = ["wholesalePrice", "resellerPrice", "retailPrice"];
    if (!validPriceTypes.includes(priceType as PriceType)) {
      return NextResponse.json({ error: "Invalid price type" }, { status: 400 });
    }
    const validatedPriceType = priceType as PriceType;

    // Get all products with their cost prices
    const products = await prisma.product.findMany({
      select: { id: true, costPrice: true },
    });

    let updatedCount = 0;

    // Update each product's price
    for (const product of products) {
      let calculatedPrice: number;

      if (markupType === "percentage") {
        // Price = Cost Price + (Cost Price * markupValue / 100)
        calculatedPrice = product.costPrice + (product.costPrice * markupValue / 100);
      } else {
        // Price = Cost Price + markupValue (fixed amount)
        calculatedPrice = product.costPrice + markupValue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { [validatedPriceType]: calculatedPrice },
      });

      updatedCount++;
    }

    const priceTypeLabels: Record<PriceType, string> = {
      wholesalePrice: "wholesale price",
      resellerPrice: "reseller price",
      retailPrice: "retail price",
    };

    return NextResponse.json({
      success: true,
      message: `Updated ${priceTypeLabels[validatedPriceType]} for ${updatedCount} products`,
      updatedCount,
      markupType,
      markupValue,
      priceType: validatedPriceType,
    });
  } catch (error) {
    console.error("Error updating bulk prices:", error);
    return NextResponse.json(
      { error: "Failed to update prices" },
      { status: 500 }
    );
  }
}
