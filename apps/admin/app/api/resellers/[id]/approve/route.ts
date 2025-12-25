import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/resellers/[id]/approve - Approve a pending reseller
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

    // Approve the reseller
    const updated = await prisma.reseller.update({
      where: { id },
      data: {
        registrationStatus: "approved",
        status: "active", // Also activate the account
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error approving reseller:", error);
    return NextResponse.json(
      { error: "Failed to approve reseller" },
      { status: 500 }
    );
  }
}
