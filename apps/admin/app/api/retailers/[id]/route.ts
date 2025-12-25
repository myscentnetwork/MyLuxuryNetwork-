import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/retailers/[id] - Get a single retailer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const retailer = await prisma.retailer.findUnique({
      where: { id },
    });

    if (!retailer) {
      return NextResponse.json(
        { error: "Retailer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(retailer);
  } catch (error) {
    console.error("Error fetching retailer:", error);
    return NextResponse.json(
      { error: "Failed to fetch retailer" },
      { status: 500 }
    );
  }
}

// PUT /api/retailers/[id] - Update a retailer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const retailer = await prisma.retailer.update({
      where: { id },
      data: {
        name: body.name,
        contactNumber: body.contactNumber || null,
        whatsappNumber: body.whatsappNumber || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        status: body.status,
        instagramHandle: body.instagramHandle || null,
        facebookHandle: body.facebookHandle || null,
        youtubeHandle: body.youtubeHandle || null,
        telegramHandle: body.telegramHandle || null,
      },
    });

    return NextResponse.json(retailer);
  } catch (error) {
    console.error("Error updating retailer:", error);
    return NextResponse.json(
      { error: "Failed to update retailer" },
      { status: 500 }
    );
  }
}

// DELETE /api/retailers/[id] - Delete a retailer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.retailer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting retailer:", error);
    return NextResponse.json(
      { error: "Failed to delete retailer" },
      { status: 500 }
    );
  }
}
