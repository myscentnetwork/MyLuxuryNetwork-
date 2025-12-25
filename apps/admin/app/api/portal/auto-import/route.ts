import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

// Helper to get user type price field
function getPriceField(userType: string): "wholesalePrice" | "resellerPrice" | "retailPrice" {
  switch (userType) {
    case "wholesaler":
      return "wholesalePrice";
    case "reseller":
      return "resellerPrice";
    case "retailer":
    default:
      return "retailPrice";
  }
}

// Calculate selling price based on markup
function calculateSellingPrice(basePrice: number, markupType: string, markupValue: number): number {
  if (markupType === "percentage") {
    return basePrice + (basePrice * markupValue / 100);
  } else {
    return basePrice + markupValue;
  }
}

// GET - Get current auto-import settings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userType = cookieStore.get("user_type")?.value;
    const userId = cookieStore.get("user_id")?.value;

    if (!userType || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let settings = null;

    if (userType === "reseller") {
      const reseller = await prisma.reseller.findUnique({
        where: { id: userId },
        select: {
          autoImportEnabled: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
      settings = reseller;
    } else if (userType === "wholesaler") {
      const wholesaler = await prisma.wholesaler.findUnique({
        where: { id: userId },
        select: {
          autoImportEnabled: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
      settings = wholesaler;
    } else if (userType === "retailer") {
      const retailer = await prisma.retailer.findUnique({
        where: { id: userId },
        select: {
          autoImportEnabled: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });
      settings = retailer;
    }

    if (!settings) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching auto-import settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Enable auto-import and import all products
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userType = cookieStore.get("user_type")?.value;
    const userId = cookieStore.get("user_id")?.value;

    if (!userType || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { markupType } = body;
    // Default to 0 if markupValue is empty, null, or undefined
    const markupValue = body.markupValue === "" || body.markupValue === null || body.markupValue === undefined
      ? 0
      : Number(body.markupValue);

    if (!markupType) {
      return NextResponse.json(
        { error: "Markup type is required" },
        { status: 400 }
      );
    }

    // Get all active products
    const allProducts = await prisma.product.findMany({
      where: { status: "in_stock" },
      select: {
        id: true,
        wholesalePrice: true,
        resellerPrice: true,
        retailPrice: true,
      },
    });

    const priceField = getPriceField(userType);

    // Filter products based on user type - only import products with their respective price set
    const products = allProducts.filter(product => {
      if (userType === "wholesaler") return (product.wholesalePrice || 0) > 0;
      if (userType === "reseller") return (product.resellerPrice || 0) > 0;
      if (userType === "retailer") return (product.retailPrice || 0) > 0;
      return false;
    });

    let importedCount = 0;

    if (userType === "reseller") {
      // Update reseller auto-import settings
      await prisma.reseller.update({
        where: { id: userId },
        data: {
          autoImportEnabled: true,
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Get existing imported product IDs
      const existingProducts = await prisma.resellerProduct.findMany({
        where: { resellerId: userId },
        select: { productId: true },
      });
      const existingProductIds = new Set(existingProducts.map(p => p.productId));

      // Import all products that aren't already imported
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product[priceField] || product.wholesalePrice || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.resellerProduct.create({
            data: {
              resellerId: userId,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          importedCount++;
        } else {
          // Update existing auto-imported products with new markup
          const basePrice = product[priceField] || product.wholesalePrice || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.resellerProduct.updateMany({
            where: {
              resellerId: userId,
              productId: product.id,
              isAutoImported: true,
            },
            data: {
              sellingPrice,
              markupType,
              markupValue,
            },
          });
        }
      }
    } else if (userType === "wholesaler") {
      // Update wholesaler auto-import settings
      await prisma.wholesaler.update({
        where: { id: userId },
        data: {
          autoImportEnabled: true,
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Get existing imported product IDs
      const existingProducts = await prisma.wholesalerProduct.findMany({
        where: { wholesalerId: userId },
        select: { productId: true },
      });
      const existingProductIds = new Set(existingProducts.map(p => p.productId));

      // Import all products that aren't already imported
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product[priceField] || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.wholesalerProduct.create({
            data: {
              wholesalerId: userId,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          importedCount++;
        } else {
          // Update existing auto-imported products with new markup
          const basePrice = product[priceField] || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.wholesalerProduct.updateMany({
            where: {
              wholesalerId: userId,
              productId: product.id,
              isAutoImported: true,
            },
            data: {
              sellingPrice,
              markupType,
              markupValue,
            },
          });
        }
      }
    } else if (userType === "retailer") {
      // Update retailer auto-import settings
      await prisma.retailer.update({
        where: { id: userId },
        data: {
          autoImportEnabled: true,
          autoImportMarkupType: markupType,
          autoImportMarkupValue: markupValue,
        },
      });

      // Get existing imported product IDs
      const existingProducts = await prisma.retailerProduct.findMany({
        where: { retailerId: userId },
        select: { productId: true },
      });
      const existingProductIds = new Set(existingProducts.map(p => p.productId));

      // Import all products that aren't already imported
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product[priceField] || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.retailerProduct.create({
            data: {
              retailerId: userId,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          importedCount++;
        } else {
          // Update existing auto-imported products with new markup
          const basePrice = product[priceField] || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.retailerProduct.updateMany({
            where: {
              retailerId: userId,
              productId: product.id,
              isAutoImported: true,
            },
            data: {
              sellingPrice,
              markupType,
              markupValue,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-import enabled. ${importedCount} new products imported.`,
      importedCount,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error("Error enabling auto-import:", error);
    return NextResponse.json(
      { error: "Failed to enable auto-import" },
      { status: 500 }
    );
  }
}

// DELETE - Disable auto-import
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const userType = cookieStore.get("user_type")?.value;
    const userId = cookieStore.get("user_id")?.value;

    if (!userType || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (userType === "reseller") {
      await prisma.reseller.update({
        where: { id: userId },
        data: {
          autoImportEnabled: false,
        },
      });
    } else if (userType === "wholesaler") {
      await prisma.wholesaler.update({
        where: { id: userId },
        data: {
          autoImportEnabled: false,
        },
      });
    } else if (userType === "retailer") {
      await prisma.retailer.update({
        where: { id: userId },
        data: {
          autoImportEnabled: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Auto-import disabled. Previously imported products remain in your store.",
    });
  } catch (error) {
    console.error("Error disabling auto-import:", error);
    return NextResponse.json(
      { error: "Failed to disable auto-import" },
      { status: 500 }
    );
  }
}
