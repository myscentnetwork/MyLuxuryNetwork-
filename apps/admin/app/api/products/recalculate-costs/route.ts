import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper function to recalculate weighted average cost price for a product
async function recalculateAverageCostPrice(productId: string): Promise<number> {
  // Get all purchase items for this product
  const purchaseItems = await prisma.purchaseItem.findMany({
    where: { productId },
  });

  if (purchaseItems.length === 0) {
    return 0;
  }

  // Calculate weighted average: sum(quantity * finalCostPrice) / sum(quantity)
  let totalCost = 0;
  let totalQuantity = 0;

  for (const item of purchaseItems) {
    const cost = item.finalCostPrice || item.costPrice;
    totalCost += item.quantity * cost;
    totalQuantity += item.quantity;
  }

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

// POST /api/products/recalculate-costs - Recalculate average cost for all products
export async function POST() {
  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, name: true, costPrice: true },
    });

    const results: Array<{
      id: string;
      sku: string;
      name: string | null;
      oldCostPrice: number;
      newCostPrice: number;
      purchaseCount: number;
    }> = [];

    for (const product of products) {
      // Get purchase item count for this product
      const purchaseItems = await prisma.purchaseItem.findMany({
        where: { productId: product.id },
      });

      // Calculate new average cost
      const newCostPrice = await recalculateAverageCostPrice(product.id);

      // Update the product if the cost has changed
      if (Math.abs(newCostPrice - product.costPrice) > 0.01) {
        await prisma.product.update({
          where: { id: product.id },
          data: { costPrice: newCostPrice },
        });
      }

      results.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        oldCostPrice: product.costPrice,
        newCostPrice: newCostPrice,
        purchaseCount: purchaseItems.length,
      });
    }

    // Summary
    const updated = results.filter(r => Math.abs(r.newCostPrice - r.oldCostPrice) > 0.01);
    const withPurchases = results.filter(r => r.purchaseCount > 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: products.length,
        productsWithPurchaseHistory: withPurchases.length,
        productsUpdated: updated.length,
      },
      details: results,
    });
  } catch (error) {
    console.error("Error recalculating costs:", error);
    return NextResponse.json({ error: "Failed to recalculate costs" }, { status: 500 });
  }
}

// GET - Just show current status without updating
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, name: true, costPrice: true },
    });

    const results: Array<{
      id: string;
      sku: string;
      name: string | null;
      currentCostPrice: number;
      calculatedAvgCost: number;
      purchaseItems: Array<{
        billNumber: string;
        quantity: number;
        costPrice: number;
        finalCostPrice: number | null;
      }>;
    }> = [];

    for (const product of products) {
      const purchaseItems = await prisma.purchaseItem.findMany({
        where: { productId: product.id },
        include: {
          purchaseBill: {
            select: { billNumber: true },
          },
        },
      });

      const calculatedAvgCost = await recalculateAverageCostPrice(product.id);

      results.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        currentCostPrice: product.costPrice,
        calculatedAvgCost: calculatedAvgCost,
        purchaseItems: purchaseItems.map(item => ({
          billNumber: item.purchaseBill.billNumber,
          quantity: item.quantity,
          costPrice: item.costPrice,
          finalCostPrice: item.finalCostPrice,
        })),
      });
    }

    return NextResponse.json({
      products: results,
      summary: {
        totalProducts: products.length,
        productsWithPurchaseHistory: results.filter(r => r.purchaseItems.length > 0).length,
        productsThatNeedUpdate: results.filter(r =>
          r.purchaseItems.length > 0 &&
          Math.abs(r.calculatedAvgCost - r.currentCostPrice) > 0.01
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching cost data:", error);
    return NextResponse.json({ error: "Failed to fetch cost data" }, { status: 500 });
  }
}
