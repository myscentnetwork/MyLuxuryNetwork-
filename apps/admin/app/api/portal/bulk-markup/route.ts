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

// POST - Apply markup to all products and set as default
export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await getUserFromCookies();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { markupType, markupValue, applyToExisting } = body;

    if (!markupType || markupValue === undefined || markupValue === null) {
      return NextResponse.json(
        { error: "Markup type and value are required" },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed"].includes(markupType)) {
      return NextResponse.json(
        { error: "Invalid markup type. Must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    if (markupValue < 0) {
      return NextResponse.json(
        { error: "Markup value cannot be negative" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let skippedCount = 0;

    if (userType === "reseller") {
      // Update reseller's default markup settings
      await prisma.reseller.update({
        where: { id: userId },
        data: {
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Apply to existing products if requested
      if (applyToExisting) {
        const products = await prisma.resellerProduct.findMany({
          where: { resellerId: userId },
          include: {
            product: {
              select: {
                resellerPrice: true,
                wholesalePrice: true,
                retailPrice: true,
                mrp: true,
              },
            },
          },
        });

        for (const item of products) {
          const costPrice = item.product.resellerPrice || item.product.wholesalePrice;
          const minSellingPrice = item.product.retailPrice;
          const mrp = item.product.mrp;

          // Calculate new selling price based on markup
          let newSellingPrice: number;
          if (markupType === "percentage") {
            newSellingPrice = minSellingPrice + (costPrice * markupValue / 100);
          } else {
            newSellingPrice = minSellingPrice + markupValue;
          }

          // Ensure price is within valid range
          if (newSellingPrice < minSellingPrice) {
            newSellingPrice = minSellingPrice;
          }
          if (newSellingPrice > mrp) {
            // Skip products where markup would exceed MRP
            skippedCount++;
            continue;
          }

          await prisma.resellerProduct.update({
            where: { id: item.id },
            data: { sellingPrice: Math.round(newSellingPrice) },
          });
          updatedCount++;
        }
      }
    } else if (userType === "wholesaler") {
      // Update wholesaler's default markup settings
      await prisma.wholesaler.update({
        where: { id: userId },
        data: {
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Apply to existing products if requested
      if (applyToExisting) {
        const products = await prisma.wholesalerProduct.findMany({
          where: { wholesalerId: userId },
          include: {
            product: {
              select: {
                wholesalePrice: true,
                retailPrice: true,
                mrp: true,
              },
            },
          },
        });

        for (const item of products) {
          const costPrice = item.product.wholesalePrice;
          const minSellingPrice = item.product.retailPrice;
          const mrp = item.product.mrp;

          // Calculate new selling price based on markup
          let newSellingPrice: number;
          if (markupType === "percentage") {
            newSellingPrice = minSellingPrice + (costPrice * markupValue / 100);
          } else {
            newSellingPrice = minSellingPrice + markupValue;
          }

          // Ensure price is within valid range
          if (newSellingPrice < minSellingPrice) {
            newSellingPrice = minSellingPrice;
          }
          if (newSellingPrice > mrp) {
            skippedCount++;
            continue;
          }

          await prisma.wholesalerProduct.update({
            where: { id: item.id },
            data: { sellingPrice: Math.round(newSellingPrice) },
          });
          updatedCount++;
        }
      }
    } else if (userType === "retailer") {
      // Update retailer's default markup settings
      await prisma.retailer.update({
        where: { id: userId },
        data: {
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Apply to existing products if requested
      if (applyToExisting) {
        const products = await prisma.retailerProduct.findMany({
          where: { retailerId: userId },
          include: {
            product: {
              select: {
                retailPrice: true,
                mrp: true,
              },
            },
          },
        });

        for (const item of products) {
          const costPrice = item.product.retailPrice;
          const minSellingPrice = item.product.retailPrice;
          const mrp = item.product.mrp;

          // Calculate new selling price based on markup
          let newSellingPrice: number;
          if (markupType === "percentage") {
            newSellingPrice = minSellingPrice + (costPrice * markupValue / 100);
          } else {
            newSellingPrice = minSellingPrice + markupValue;
          }

          // Ensure price is within valid range
          if (newSellingPrice < minSellingPrice) {
            newSellingPrice = minSellingPrice;
          }
          if (newSellingPrice > mrp) {
            skippedCount++;
            continue;
          }

          await prisma.retailerProduct.update({
            where: { id: item.id },
            data: { sellingPrice: Math.round(newSellingPrice) },
          });
          updatedCount++;
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: applyToExisting
        ? `Default markup saved. Updated ${updatedCount} products${skippedCount > 0 ? `, skipped ${skippedCount} (would exceed MRP)` : ""}.`
        : "Default markup saved for future imports.",
      updatedCount,
      skippedCount,
    });
  } catch (error) {
    console.error("Error applying bulk markup:", error);
    return NextResponse.json(
      { error: "Failed to apply markup" },
      { status: 500 }
    );
  }
}

// GET - Get current default markup settings
export async function GET() {
  try {
    const { userId, userType } = await getUserFromCookies();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let user;

    if (userType === "reseller") {
      user = await prisma.reseller.findUnique({
        where: { id: userId },
        select: {
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
    } else if (userType === "wholesaler") {
      user = await prisma.wholesaler.findUnique({
        where: { id: userId },
        select: {
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
    } else if (userType === "retailer") {
      user = await prisma.retailer.findUnique({
        where: { id: userId },
        select: {
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      markupType: user?.autoImportMarkupType || null,
      markupValue: user?.autoImportMarkupValue || null,
    });
  } catch (error) {
    console.error("Error fetching markup settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch markup settings" },
      { status: 500 }
    );
  }
}
