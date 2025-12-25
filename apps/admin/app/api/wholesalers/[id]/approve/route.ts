import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/wholesalers/[id]/approve - Approve a pending wholesaler
export async function POST(
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

    if (wholesaler.registrationStatus !== "pending") {
      return NextResponse.json(
        { error: "Wholesaler is not pending approval" },
        { status: 400 }
      );
    }

    const updated = await prisma.wholesaler.update({
      where: { id },
      data: {
        registrationStatus: "approved",
        status: "active",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error approving wholesaler:", error);
    return NextResponse.json(
      { error: "Failed to approve wholesaler" },
      { status: 500 }
    );
  }
}
