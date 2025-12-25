import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/resellers/[id]/reject - Reject a pending reseller
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the reseller
    const reseller = await prisma.reseller.findUnique({
      where: { id },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Reseller not found" },
        { status: 404 }
      );
    }

    if (reseller.registrationStatus !== "pending") {
      return NextResponse.json(
        { error: "Reseller is not pending approval" },
        { status: 400 }
      );
    }

    // Reject the reseller
    const updated = await prisma.reseller.update({
      where: { id },
      data: {
        registrationStatus: "rejected",
        status: "inactive",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error rejecting reseller:", error);
    return NextResponse.json(
      { error: "Failed to reject reseller" },
      { status: 500 }
    );
  }
}
