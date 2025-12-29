import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

// GET all order bills - Optimized with batch user fetching
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

    // Batch fetch all users by type to avoid N+1 queries
    const wholesalerIds = orders.filter(o => o.userType === "wholesaler").map(o => o.userId);
    const resellerIds = orders.filter(o => o.userType === "reseller").map(o => o.userId);
    const retailerIds = orders.filter(o => o.userType === "retailer").map(o => o.userId);

    // Fetch all users in parallel
    const [wholesalers, resellers, retailers] = await Promise.all([
      wholesalerIds.length > 0
        ? prisma.wholesaler.findMany({
            where: { id: { in: wholesalerIds } },
            select: { id: true, name: true, companyName: true, contactNumber: true, email: true },
          })
        : [],
      resellerIds.length > 0
        ? prisma.reseller.findMany({
            where: { id: { in: resellerIds } },
            select: { id: true, name: true, shopName: true, contactNumber: true, email: true },
          })
        : [],
      retailerIds.length > 0
        ? prisma.retailer.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true, contactNumber: true, email: true },
          })
        : [],
    ]);

    // Create lookup maps for O(1) access
    const wholesalerMap = new Map(wholesalers.map(u => [u.id, u]));
    const resellerMap = new Map(resellers.map(u => [u.id, u]));
    const retailerMap = new Map(retailers.map(u => [u.id, u]));

    // Map orders with users
    const ordersWithUsers = orders.map(order => {
      let user = null;
      if (order.userType === "wholesaler") {
        user = wholesalerMap.get(order.userId) || null;
      } else if (order.userType === "reseller") {
        user = resellerMap.get(order.userId) || null;
      } else if (order.userType === "retailer") {
        user = retailerMap.get(order.userId) || null;
      }
      return { ...order, user };
    });

    // Add cache headers
    return NextResponse.json(ordersWithUsers, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
      },
    });
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
      userId,
      userType,
      items,
      subtotal,
      totalDiscount,
      grandTotal,
      status = "pending",
    } = body;

    // Validate required fields
    if (!invoiceNumber || !date || !userId || !userType || !items || items.length === 0) {
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
        userId,
        userType,
        resellerId: userType === "reseller" ? userId : null,
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
              productName: product?.name || product?.sku || "Unknown Product",
              productImage: product?.images?.[0]?.url || null,
            };
          }),
        },
      },
      include: {
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
