import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// This endpoint syncs all auto-import enabled users with new products
// Called when a new product is added or to manually sync

// Calculate selling price based on markup
function calculateSellingPrice(basePrice: number, markupType: string, markupValue: number): number {
  if (markupType === "percentage") {
    return basePrice + (basePrice * markupValue / 100);
  } else {
    return basePrice + markupValue;
  }
}

export async function POST() {
  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { status: "in_stock" },
      select: {
        id: true,
        wholesalePrice: true,
        resellerPrice: true,
        retailPrice: true,
      },
    });

    let syncStats = {
      resellersProcessed: 0,
      wholesalersProcessed: 0,
      retailersProcessed: 0,
      productsAdded: 0,
      productsRemoved: 0,
    };

    // Get all product IDs for removal check
    const allProductIds = new Set(products.map(p => p.id));

    // Sync for resellers with auto-import enabled
    const resellers = await prisma.reseller.findMany({
      where: { autoImportEnabled: true },
      select: {
        id: true,
        autoImportMarkupType: true,
        autoImportMarkupValue: true,
        importedProducts: {
          select: { productId: true, isAutoImported: true },
        },
      },
    });

    for (const reseller of resellers) {
      syncStats.resellersProcessed++;
      const existingProductIds = new Set(reseller.importedProducts.map(p => p.productId));
      const markupType = reseller.autoImportMarkupType || "percentage";
      const markupValue = reseller.autoImportMarkupValue || 0;

      // Add new products
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product.resellerPrice || product.wholesalePrice || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.resellerProduct.create({
            data: {
              resellerId: reseller.id,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          syncStats.productsAdded++;
        }
      }

      // Remove products that no longer exist (only auto-imported ones)
      for (const imported of reseller.importedProducts) {
        if (imported.isAutoImported && !allProductIds.has(imported.productId)) {
          await prisma.resellerProduct.deleteMany({
            where: {
              resellerId: reseller.id,
              productId: imported.productId,
              isAutoImported: true,
            },
          });
          syncStats.productsRemoved++;
        }
      }
    }

    // Sync for wholesalers with auto-import enabled
    const wholesalers = await prisma.wholesaler.findMany({
      where: { autoImportEnabled: true },
      select: {
        id: true,
        autoImportMarkupType: true,
        autoImportMarkupValue: true,
        importedProducts: {
          select: { productId: true, isAutoImported: true },
        },
      },
    });

    for (const wholesaler of wholesalers) {
      syncStats.wholesalersProcessed++;
      const existingProductIds = new Set(wholesaler.importedProducts.map(p => p.productId));
      const markupType = wholesaler.autoImportMarkupType || "percentage";
      const markupValue = wholesaler.autoImportMarkupValue || 0;

      // Add new products
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product.wholesalePrice || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.wholesalerProduct.create({
            data: {
              wholesalerId: wholesaler.id,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          syncStats.productsAdded++;
        }
      }

      // Remove products that no longer exist (only auto-imported ones)
      for (const imported of wholesaler.importedProducts) {
        if (imported.isAutoImported && !allProductIds.has(imported.productId)) {
          await prisma.wholesalerProduct.deleteMany({
            where: {
              wholesalerId: wholesaler.id,
              productId: imported.productId,
              isAutoImported: true,
            },
          });
          syncStats.productsRemoved++;
        }
      }
    }

    // Sync for retailers with auto-import enabled
    const retailers = await prisma.retailer.findMany({
      where: { autoImportEnabled: true },
      select: {
        id: true,
        autoImportMarkupType: true,
        autoImportMarkupValue: true,
        importedProducts: {
          select: { productId: true, isAutoImported: true },
        },
      },
    });

    for (const retailer of retailers) {
      syncStats.retailersProcessed++;
      const existingProductIds = new Set(retailer.importedProducts.map(p => p.productId));
      const markupType = retailer.autoImportMarkupType || "percentage";
      const markupValue = retailer.autoImportMarkupValue || 0;

      // Add new products
      for (const product of products) {
        if (!existingProductIds.has(product.id)) {
          const basePrice = product.retailPrice || 0;
          const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

          await prisma.retailerProduct.create({
            data: {
              retailerId: retailer.id,
              productId: product.id,
              sellingPrice,
              markupType,
              markupValue,
              isAutoImported: true,
            },
          });
          syncStats.productsAdded++;
        }
      }

      // Remove products that no longer exist (only auto-imported ones)
      for (const imported of retailer.importedProducts) {
        if (imported.isAutoImported && !allProductIds.has(imported.productId)) {
          await prisma.retailerProduct.deleteMany({
            where: {
              retailerId: retailer.id,
              productId: imported.productId,
              isAutoImported: true,
            },
          });
          syncStats.productsRemoved++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Auto-import sync completed",
      stats: syncStats,
    });
  } catch (error) {
    console.error("Error syncing auto-import:", error);
    return NextResponse.json(
      { error: "Failed to sync auto-import" },
      { status: 500 }
    );
  }
}
