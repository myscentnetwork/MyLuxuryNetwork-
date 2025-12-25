import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/resellers/[id] - Get a single reseller
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reseller = await prisma.reseller.findUnique({
      where: { id },
    });

    if (!reseller) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    }

    return NextResponse.json(reseller);
  } catch (error) {
    console.error("Error fetching reseller:", error);
    return NextResponse.json({ error: "Failed to fetch reseller" }, { status: 500 });
  }
}

// PUT /api/resellers/[id] - Update a reseller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      contactNumber,
      whatsappNumber,
      shopName,
      email,
      storeAddress,
      customDomain,
      status,
      storeLogo,
      storeBanner,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      telegramHandle,
    } = body;

    // Upload store logo to Cloudinary if provided as base64
    let storeLogoUrl = storeLogo;
    if (storeLogo && storeLogo.startsWith("data:")) {
      const result = await uploadImage(storeLogo, "myluxury/resellers/logos");
      storeLogoUrl = result?.url || null;
    }

    // Upload store banner to Cloudinary if provided as base64
    let storeBannerUrl = storeBanner;
    if (storeBanner && storeBanner.startsWith("data:")) {
      const result = await uploadImage(storeBanner, "myluxury/resellers/banners");
      storeBannerUrl = result?.url || null;
    }

    const reseller = await prisma.reseller.update({
      where: { id },
      data: {
        name,
        contactNumber,
        whatsappNumber,
        shopName,
        email,
        storeAddress,
        customDomain,
        status,
        storeLogo: storeLogoUrl,
        storeBanner: storeBannerUrl,
        instagramHandle,
        facebookHandle,
        youtubeHandle,
        telegramHandle,
      },
    });

    return NextResponse.json(reseller);
  } catch (error) {
    console.error("Error updating reseller:", error);
    return NextResponse.json({ error: "Failed to update reseller" }, { status: 500 });
  }
}

// DELETE /api/resellers/[id] - Delete a reseller
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.reseller.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reseller:", error);
    return NextResponse.json({ error: "Failed to delete reseller" }, { status: 500 });
  }
}
