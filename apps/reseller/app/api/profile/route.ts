import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// Helper to get reseller from cookie
async function getResellerId() {
  const cookieStore = await cookies();
  return cookieStore.get("reseller_id")?.value;
}

// GET /api/profile - Get reseller profile
export async function GET() {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const reseller = await prisma.reseller.findUnique({
      where: { id: resellerId },
      include: {
        selectedCategories: {
          include: { category: true },
        },
        _count: {
          select: { importedProducts: true },
        },
      },
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
      username: reseller.username,
      email: reseller.email,
      contactNumber: reseller.contactNumber,
      whatsappNumber: reseller.whatsappNumber,
      shopName: reseller.shopName,
      storeAddress: reseller.storeAddress,
      storeLogo: reseller.storeLogo,
      storeBanner: reseller.storeBanner,
      instagramHandle: reseller.instagramHandle,
      facebookHandle: reseller.facebookHandle,
      youtubeHandle: reseller.youtubeHandle,
      telegramHandle: reseller.telegramHandle,
      customDomain: reseller.customDomain,
      status: reseller.status,
      categories: reseller.selectedCategories.map((sc) => ({
        id: sc.category.id,
        name: sc.category.name,
      })),
      productCount: reseller._count.importedProducts,
      storeUrl: reseller.username
        ? `${process.env.STORE_BASE_URL || "http://localhost:3002"}/${reseller.username}`
        : null,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update reseller profile
export async function PUT(request: NextRequest) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = [
      "username",
      "shopName",
      "whatsappNumber",
      "storeAddress",
      "storeLogo",
      "storeBanner",
      "instagramHandle",
      "facebookUrl",
      "xUrl",
      "linkedinUrl",
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate username uniqueness if being updated
    if (updateData.username) {
      const existing = await prisma.reseller.findFirst({
        where: {
          username: updateData.username.toLowerCase(),
          id: { not: resellerId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }

      updateData.username = updateData.username.toLowerCase();
    }

    const updated = await prisma.reseller.update({
      where: { id: resellerId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        shopName: updated.shopName,
        whatsappNumber: updated.whatsappNumber,
        storeLogo: updated.storeLogo,
        storeBanner: updated.storeBanner,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
