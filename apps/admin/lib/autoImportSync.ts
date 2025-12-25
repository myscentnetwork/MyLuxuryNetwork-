import prisma from "@/lib/db";

// Calculate selling price based on markup
function calculateSellingPrice(basePrice: number, markupType: string, markupValue: number): number {
  if (markupType === "percentage") {
    return basePrice + (basePrice * markupValue / 100);
  } else {
    return basePrice + markupValue;
  }
}

interface Product {
  id: string;
  wholesalePrice: number;
  resellerPrice: number;
  retailPrice: number;
}

/**
 * Sync a new product to all users with auto-import enabled
 * Called when a new product is created or when status changes to in_stock
 */
export async function syncNewProduct(product: Product) {
  try {
    // Sync for resellers with auto-import enabled (only if resellerPrice is set)
    if ((product.resellerPrice || 0) > 0) {
      const resellers = await prisma.reseller.findMany({
        where: { autoImportEnabled: true },
        select: {
          id: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });

      for (const reseller of resellers) {
        const markupType = reseller.autoImportMarkupType || "percentage";
        const markupValue = reseller.autoImportMarkupValue || 0;
        const basePrice = product.resellerPrice || 0;
        const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

        // Use upsert to handle race conditions
        await prisma.resellerProduct.upsert({
          where: {
            resellerId_productId: {
              resellerId: reseller.id,
              productId: product.id,
            },
          },
          create: {
            resellerId: reseller.id,
            productId: product.id,
            sellingPrice,
            markupType,
            markupValue,
            isAutoImported: true,
          },
          update: {
            // Only update if it was auto-imported
            sellingPrice,
            markupType,
            markupValue,
          },
        });
      }
    }

    // Sync for wholesalers with auto-import enabled (only if wholesalePrice is set)
    if ((product.wholesalePrice || 0) > 0) {
      const wholesalers = await prisma.wholesaler.findMany({
        where: { autoImportEnabled: true },
        select: {
          id: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });

      for (const wholesaler of wholesalers) {
        const markupType = wholesaler.autoImportMarkupType || "percentage";
        const markupValue = wholesaler.autoImportMarkupValue || 0;
        const basePrice = product.wholesalePrice || 0;
        const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

        await prisma.wholesalerProduct.upsert({
          where: {
            wholesalerId_productId: {
              wholesalerId: wholesaler.id,
              productId: product.id,
            },
          },
          create: {
            wholesalerId: wholesaler.id,
            productId: product.id,
            sellingPrice,
            markupType,
            markupValue,
            isAutoImported: true,
          },
          update: {
            sellingPrice,
            markupType,
            markupValue,
          },
        });
      }
    }

    // Sync for retailers with auto-import enabled (only if retailPrice is set)
    if ((product.retailPrice || 0) > 0) {
      const retailers = await prisma.retailer.findMany({
        where: { autoImportEnabled: true },
        select: {
          id: true,
          autoImportMarkupType: true,
          autoImportMarkupValue: true,
        },
      });

      for (const retailer of retailers) {
        const markupType = retailer.autoImportMarkupType || "percentage";
        const markupValue = retailer.autoImportMarkupValue || 0;
        const basePrice = product.retailPrice || 0;
        const sellingPrice = calculateSellingPrice(basePrice, markupType, markupValue);

        await prisma.retailerProduct.upsert({
          where: {
            retailerId_productId: {
              retailerId: retailer.id,
              productId: product.id,
            },
          },
          create: {
            retailerId: retailer.id,
            productId: product.id,
            sellingPrice,
            markupType,
            markupValue,
            isAutoImported: true,
          },
          update: {
            sellingPrice,
            markupType,
            markupValue,
          },
        });
      }
    }

    console.log(`Auto-import sync completed for product ${product.id}`);
  } catch (error) {
    console.error("Error syncing new product for auto-import:", error);
  }
}

/**
 * Remove a deleted product from all auto-imported stores
 * Called when a product is deleted
 */
export async function syncRemovedProduct(productId: string) {
  try {
    // Remove from resellers (only auto-imported)
    await prisma.resellerProduct.deleteMany({
      where: {
        productId,
        isAutoImported: true,
      },
    });

    // Remove from wholesalers (only auto-imported)
    await prisma.wholesalerProduct.deleteMany({
      where: {
        productId,
        isAutoImported: true,
      },
    });

    // Remove from retailers (only auto-imported)
    await prisma.retailerProduct.deleteMany({
      where: {
        productId,
        isAutoImported: true,
      },
    });

    console.log(`Auto-import removal completed for product ${productId}`);
  } catch (error) {
    console.error("Error removing product from auto-import stores:", error);
  }
}
