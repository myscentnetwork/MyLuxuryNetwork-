import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// GET /api/reseller/profile - Get reseller profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const resellerId = cookieStore.get("reseller_id")?.value;

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const reseller = await prisma.reseller.findUnique({
      where: { id: resellerId },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Reseller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: reseller.id,
      name: reseller.name,
      email: reseller.email,
      shopName: reseller.shopName,
      username: reseller.username,
      status: reseller.status,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
