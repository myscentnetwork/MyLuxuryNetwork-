import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

// GET single order bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.orderBill.findUnique({
      where: { id },
      include: {
        reseller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            contactNumber: true,
            email: true,
            storeAddress: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PUT update order bill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...otherFields } = body;

    const order = await prisma.orderBill.update({
      where: { id },
      data: {
        status,
        ...otherFields,
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE order bill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.orderBill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
