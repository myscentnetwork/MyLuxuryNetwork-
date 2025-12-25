import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// GET /api/portal/check-slug?slug=xxx - Check if slug is available
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userType = cookieStore.get("user_type")?.value;
    const userId = cookieStore.get("user_id")?.value;

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Clean the slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 30);

    if (cleanSlug.length < 3) {
      return NextResponse.json({
        available: false,
        message: "Store URL must be at least 3 characters",
      });
    }

    // Check if username is already taken by any user
    const existingReseller = await prisma.reseller.findUnique({
      where: { username: cleanSlug },
      select: { id: true },
    });
    const existingWholesaler = await prisma.wholesaler.findUnique({
      where: { username: cleanSlug },
      select: { id: true },
    });
    const existingRetailer = await prisma.retailer.findUnique({
      where: { username: cleanSlug },
      select: { id: true },
    });

    // Check if any of the existing users is the current user (their own username)
    const isOwnUsername =
      (userType === "reseller" && existingReseller?.id === userId) ||
      (userType === "wholesaler" && existingWholesaler?.id === userId) ||
      (userType === "retailer" && existingRetailer?.id === userId);

    // Available if no one has it, or if it's the current user's own username
    const isTaken = existingReseller || existingWholesaler || existingRetailer;
    const available = !isTaken || isOwnUsername;

    return NextResponse.json({
      available,
      cleanSlug,
      message: available
        ? "Store URL is available"
        : "This store URL is already taken",
    });
  } catch (error) {
    console.error("Check slug error:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    );
  }
}
