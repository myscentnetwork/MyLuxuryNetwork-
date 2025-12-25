import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

// GET all order bills
export async function GET() {
  try {
    const orders = await prisma.orderBill.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reseller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            contactNumber: true,
            email: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST create new order bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      date,
      time,
      resellerId,
      items,
      subtotal,
      totalDiscount,
      grandTotal,
      status = "pending",
    } = body;

    // Validate required fields
    if (!invoiceNumber || !date || !resellerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product details for snapshots
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Create order bill with items
    const order = await prisma.orderBill.create({
      data: {
        invoiceNumber,
        date,
        time,
        resellerId,
        subtotal,
        totalDiscount,
        grandTotal,
        status,
        items: {
          create: items.map((item: any) => {
            const product = productMap.get(item.productId);
            return {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              total: item.total,
              productId: item.productId,
              productSku: product?.sku || "Unknown",
              productName: product?.description || product?.sku || "Unknown Product",
              productImage: product?.images?.[0]?.url || null,
            };
          }),
        },
      },
      include: {
        reseller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            contactNumber: true,
            email: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Invoice number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
