import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/wholesalers/[id] - Get single wholesaler
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wholesaler = await prisma.wholesaler.findUnique({
      where: { id },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: "Wholesaler not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(wholesaler);
  } catch (error) {
    console.error("Error fetching wholesaler:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesaler" },
      { status: 500 }
    );
  }
}

// PUT /api/wholesalers/[id] - Update wholesaler
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      companyName,
      contactNumber,
      whatsappNumber,
      email,
      address,
      city,
      gstNumber,
      status,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      telegramHandle,
    } = body;

    const wholesaler = await prisma.wholesaler.update({
      where: { id },
      data: {
        name,
        companyName: companyName || null,
        contactNumber: contactNumber || null,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        address: address || null,
        city: city || null,
        gstNumber: gstNumber || null,
        status,
        instagramHandle: instagramHandle || null,
        facebookHandle: facebookHandle || null,
        youtubeHandle: youtubeHandle || null,
        telegramHandle: telegramHandle || null,
      },
    });

    return NextResponse.json(wholesaler);
  } catch (error) {
    console.error("Error updating wholesaler:", error);
    return NextResponse.json(
      { error: "Failed to update wholesaler" },
      { status: 500 }
    );
  }
}

// DELETE /api/wholesalers/[id] - Delete wholesaler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.wholesaler.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wholesaler:", error);
    return NextResponse.json(
      { error: "Failed to delete wholesaler" },
      { status: 500 }
    );
  }
}
