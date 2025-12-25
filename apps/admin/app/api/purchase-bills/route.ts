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

// GET /api/purchase-bills - List all purchase bills
export async function GET() {
  try {
    const bills = await prisma.purchaseBill.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    const transformed = bills.map((bill: typeof bills[number]) => ({
      ...bill,
      vendorName: bill.vendor.name,
      vendorCategories: bill.vendor.categories.map((c: { category: { name: string } }) => c.category.name),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching purchase bills:", error);
    return NextResponse.json({ error: "Failed to fetch purchase bills" }, { status: 500 });
  }
}

// POST /api/purchase-bills - Create a new purchase bill
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      billNumber,
      date,
      time,
      vendorId,
      items = [],
      shippingCharges = 0,
      miscellaneous = 0,
      originalBox = 0,
      totalAmount = 0,
      paidAmount = 0,
      paymentMode = null,
      transactionDetails = null,
      status = "pending",
    } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor is required" },
        { status: 400 }
      );
    }

    // Auto-generate bill number if not provided
    let finalBillNumber = billNumber;
    if (!finalBillNumber) {
      const today = new Date();
      const datePrefix = `PB${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

      // Get count of bills created today
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayBillCount = await prisma.purchaseBill.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      finalBillNumber = `${datePrefix}-${String(todayBillCount + 1).padStart(3, '0')}`;
    }

    // Balance = Total (Vendor Amount + Expenses) - Paid Amount
    const totalWithExpenses = totalAmount + shippingCharges + miscellaneous + originalBox;
    const balanceAmount = totalWithExpenses - paidAmount;

    const bill = await prisma.purchaseBill.create({
      data: {
        billNumber: finalBillNumber,
        date,
        time,
        vendorId,
        shippingCharges,
        miscellaneous,
        originalBox,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentMode,
        transactionDetails,
        status,
        items: {
          create: items.map((item: {
            productId: string;
            productSku: string;
            productName: string;
            productImage?: string;
            quantity: number;
            mrp?: number;
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
        },
        // Create initial payment entry if paidAmount > 0
        payments: paidAmount > 0 ? {
          create: {
            amount: paidAmount,
            paymentMode: paymentMode || "cash",
            transactionDetails: transactionDetails || null,
            paymentDate: date,
            paymentTime: time || null,
          },
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
        payments: true,
      },
    });

    // Update product stock, MRP, and recalculate weighted average cost price for each item
    for (const item of items) {
      // First increment the stock and update MRP if provided
      const updateData: { stockQuantity: { increment: number }; status: string; mrp?: number } = {
        stockQuantity: { increment: item.quantity },
        status: "in_stock", // Auto set to in_stock when purchased
      };

      // Update MRP if provided and greater than 0
      if (item.mrp && item.mrp > 0) {
        updateData.mrp = item.mrp;
      }

      await prisma.product.update({
        where: { id: item.productId },
        data: updateData,
      });

      // Then recalculate the weighted average cost price from all purchase history
      const averageCostPrice = await recalculateAverageCostPrice(item.productId);
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          costPrice: averageCostPrice,
        },
      });
    }

    return NextResponse.json({
      ...bill,
      vendorName: bill.vendor.name,
      vendorCategories: bill.vendor.categories.map((c: { category: { name: string } }) => c.category.name),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase bill:", error);
    return NextResponse.json({ error: "Failed to create purchase bill" }, { status: 500 });
  }
}
