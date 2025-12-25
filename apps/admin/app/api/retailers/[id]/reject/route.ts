import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/retailers/[id]/reject - Reject a pending retailer
export async function POST(
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

    if (retailer.registrationStatus !== "pending") {
      return NextResponse.json(
        { error: "Retailer is not pending approval" },
        { status: 400 }
      );
    }

    const updated = await prisma.retailer.update({
      where: { id },
      data: {
        registrationStatus: "rejected",
        status: "inactive",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error rejecting retailer:", error);
    return NextResponse.json(
      { error: "Failed to reject retailer" },
      { status: 500 }
    );
  }
}
