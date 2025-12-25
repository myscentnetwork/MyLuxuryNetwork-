import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/products/generate-sku - Generate SKU for a category+brand combination
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, brandId } = body;

    if (!categoryId || !brandId) {
      return NextResponse.json({ error: "Category and Brand are required" }, { status: 400 });
    }

    // Get category and brand names
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    });

    if (!category || !brand) {
      return NextResponse.json({ error: "Category or Brand not found" }, { status: 404 });
    }

    // Generate brand part (first word only, uppercase)
    const brandPart = (brand.name.split(/\s+/)[0] || "BRAND")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    // Get all existing SKUs for this brand to find gaps
    const existingProducts = await prisma.product.findMany({
      where: { brandId },
      select: { sku: true },
    });

    // Extract serial numbers from existing SKUs
    const usedNumbers = existingProducts
      .map((p) => {
        const match = p.sku.match(/-(\d+)$/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0)
      .sort((a, b) => a - b);

    // Find the first available number (gap or next)
    let serialNum = 1;
    for (const num of usedNumbers) {
      if (num === serialNum) {
        serialNum++;
      } else if (num > serialNum) {
        break; // Found a gap
      }
    }

    // Generate serial number (padded to 2 digits)
    const serialNumber = String(serialNum).padStart(2, "0");

    // Combine to form SKU (BRAND-SERIAL)
    const sku = `${brandPart}-${serialNumber}`;

    return NextResponse.json({ sku });
  } catch (error) {
    console.error("Error generating SKU:", error);
    return NextResponse.json({ error: "Failed to generate SKU" }, { status: 500 });
  }
}
