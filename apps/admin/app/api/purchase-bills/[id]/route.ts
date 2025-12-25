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

// GET /api/purchase-bills/[id] - Get a single purchase bill
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            categories: {
              include: { category: true },
            },
          },
        },
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Purchase bill not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...bill,
      vendorName: bill.vendor.name,
      vendorCategories: bill.vendor.categories.map((c: { category: { name: string } }) => c.category.name),
    });
  } catch (error) {
    console.error("Error fetching purchase bill:", error);
    return NextResponse.json({ error: "Failed to fetch purchase bill" }, { status: 500 });
  }
}

// PUT /api/purchase-bills/[id] - Update a purchase bill
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      billNumber,
      date,
      time,
      vendorId,
      items,
      shippingCharges,
      miscellaneous,
      originalBox,
      totalAmount,
      paidAmount,
      paymentMode,
      transactionDetails,
      status,
    } = body;

    // Get old bill with items
    const oldBill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!oldBill) {
      return NextResponse.json({ error: "Purchase bill not found" }, { status: 404 });
    }

    // Calculate new expenses
    const newShippingCharges = shippingCharges ?? oldBill.shippingCharges;
    const newMiscellaneous = miscellaneous ?? oldBill.miscellaneous;
    const newOriginalBox = originalBox ?? oldBill.originalBox;
    const expenses = newShippingCharges + newMiscellaneous + newOriginalBox;

    // Balance = Total (Vendor Amount + Expenses) - Paid Amount
    const newTotalAmount = totalAmount ?? oldBill.totalAmount;
    const newPaidAmount = paidAmount ?? oldBill.paidAmount;
    const balanceAmount = (newTotalAmount + expenses) - newPaidAmount;

    // Collect all affected product IDs for recalculating average cost later
    const affectedProductIds = new Set<string>();

    // Determine which items to use - either provided items or existing items with recalculated costs
    let itemsToUse = items;

    // If items not provided but expenses changed, recalculate distributed costs for existing items
    if (!items && oldBill.items.length > 0) {
      const oldExpenses = oldBill.shippingCharges + oldBill.miscellaneous + oldBill.originalBox;
      const expensesChanged = expenses !== oldExpenses;

      if (expensesChanged) {
        // Calculate total quantity for distribution
        const totalQuantity = oldBill.items.reduce((sum, item) => sum + item.quantity, 0);
        const distributedCostPerUnit = totalQuantity > 0 ? expenses / totalQuantity : 0;

        // Recalculate each item's distributed cost and final cost price
        itemsToUse = oldBill.items.map(item => ({
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          costPrice: item.costPrice,
          distributedCost: distributedCostPerUnit * item.quantity,
          finalCostPrice: item.costPrice + distributedCostPerUnit,
          total: item.quantity * item.costPrice,
        }));
      }
    }

    // If we have items to update (either new items or recalculated existing items)
    if (itemsToUse) {
      // Revert stock for old items
      for (const oldItem of oldBill.items) {
        affectedProductIds.add(oldItem.productId);
        await prisma.product.update({
          where: { id: oldItem.productId },
          data: {
            stockQuantity: { decrement: oldItem.quantity },
          },
        });
      }
    }

    const bill = await prisma.purchaseBill.update({
      where: { id },
      data: {
        billNumber,
        date,
        time,
        vendorId,
        shippingCharges: newShippingCharges,
        miscellaneous: newMiscellaneous,
        originalBox: newOriginalBox,
        totalAmount: newTotalAmount,
        paidAmount: newPaidAmount,
        balanceAmount,
        paymentMode,
        transactionDetails,
        status,
        items: itemsToUse ? {
          deleteMany: {},
          create: itemsToUse.map((item: {
            productId: string;
            productSku: string;
            productName: string;
            productImage?: string | null;
            quantity: number;
            costPrice: number;
            distributedCost?: number;
            finalCostPrice?: number;
            total: number;
          }) => ({
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            costPrice: item.costPrice,
            distributedCost: item.distributedCost || 0,
            finalCostPrice: item.finalCostPrice || item.costPrice,
            total: item.total,
          })),
        } : undefined,
      },
      include: {
        vendor: {
          include: {
            categories: {
              include: { category: true },
            },
          },
        },
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Update product stock for items
    if (itemsToUse) {
      for (const item of itemsToUse) {
        affectedProductIds.add(item.productId);
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            status: "in_stock",
          },
        });
      }
    }

    // Recalculate weighted average cost price for all affected products
    for (const productId of affectedProductIds) {
      const averageCostPrice = await recalculateAverageCostPrice(productId);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          costPrice: averageCostPrice,
          // If stock is 0 after update, set status to out_of_stock
          status: (product?.stockQuantity || 0) > 0 ? "in_stock" : "out_of_stock",
        },
      });
    }

    return NextResponse.json({
      ...bill,
      vendorName: bill.vendor.name,
      vendorCategories: bill.vendor.categories.map((c: { category: { name: string } }) => c.category.name),
    });
  } catch (error) {
    console.error("Error updating purchase bill:", error);
    return NextResponse.json({ error: "Failed to update purchase bill" }, { status: 500 });
  }
}

// DELETE /api/purchase-bills/[id] - Delete a purchase bill
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the bill with its items before deleting to revert stock and recalculate average
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!bill) {
      return NextResponse.json({ error: "Purchase bill not found" }, { status: 404 });
    }

    // Collect affected product IDs and revert stock
    const affectedProductIds: string[] = [];
    for (const item of bill.items) {
      affectedProductIds.push(item.productId);
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
    }

    // Delete the bill (cascade will delete items)
    await prisma.purchaseBill.delete({
      where: { id },
    });

    // Recalculate weighted average cost price for all affected products
    for (const productId of affectedProductIds) {
      const averageCostPrice = await recalculateAverageCostPrice(productId);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          costPrice: averageCostPrice,
          // If stock is 0 after deletion, set status to out_of_stock
          status: (product?.stockQuantity || 0) > 0 ? "in_stock" : "out_of_stock",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase bill:", error);
    return NextResponse.json({ error: "Failed to delete purchase bill" }, { status: 500 });
  }
}
