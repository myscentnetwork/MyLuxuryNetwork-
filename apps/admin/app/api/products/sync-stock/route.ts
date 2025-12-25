import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/products/sync-stock - Sync stock from purchase bills
export async function POST() {
  try {
    // Reset all product stock to 0
    await prisma.product.updateMany({
      data: {
        stockQuantity: 0,
        status: "out_of_stock",
      },
    });

    // Get all non-cancelled purchase bills with items
    const bills = await prisma.purchaseBill.findMany({
      where: {
        status: { not: "cancelled" },
      },
      include: {
        items: true,
      },
    });

    // Calculate total stock per product
    const stockMap: Record<string, { quantity: number; costPrice: number }> = {};

    for (const bill of bills) {
      for (const item of bill.items) {
        if (!stockMap[item.productId]) {
          stockMap[item.productId] = {
            quantity: 0,
            costPrice: 0,
          };
        }
        const productStock = stockMap[item.productId]!;
        productStock.quantity += item.quantity;
        // Use the final cost price (with distributed expenses) or base cost price
        productStock.costPrice = item.finalCostPrice || item.costPrice;
      }
    }

    // Update each product's stock
    for (const [productId, data] of Object.entries(stockMap)) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          stockQuantity: data.quantity,
          costPrice: data.costPrice,
          status: data.quantity > 0 ? "in_stock" : "out_of_stock",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Synced stock for ${Object.keys(stockMap).length} products from ${bills.length} bills`,
      details: stockMap,
    });
  } catch (error) {
    console.error("Error syncing stock:", error);
    return NextResponse.json({ error: "Failed to sync stock" }, { status: 500 });
  }
}
