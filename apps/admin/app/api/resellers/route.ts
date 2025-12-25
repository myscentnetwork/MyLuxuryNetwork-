import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/resellers - List all resellers
export async function GET() {
  try {
    const resellers = await prisma.reseller.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resellers);
  } catch (error) {
    console.error("Error fetching resellers:", error);
    return NextResponse.json({ error: "Failed to fetch resellers" }, { status: 500 });
  }
}

// POST /api/resellers - Create a new reseller
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      contactNumber,
      whatsappNumber,
      shopName,
      email,
      storeAddress,
      customDomain,
      status = "inactive",
      storeLogo,
      storeBanner,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      telegramHandle,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Upload store logo to Cloudinary if provided as base64
    let storeLogoUrl: string | null = null;
    if (storeLogo && storeLogo.startsWith("data:")) {
      const result = await uploadImage(storeLogo, "myluxury/resellers/logos");
      storeLogoUrl = result?.url || null;
    } else if (storeLogo) {
      storeLogoUrl = storeLogo;
    }

    // Upload store banner to Cloudinary if provided as base64
    let storeBannerUrl: string | null = null;
    if (storeBanner && storeBanner.startsWith("data:")) {
      const result = await uploadImage(storeBanner, "myluxury/resellers/banners");
      storeBannerUrl = result?.url || null;
    } else if (storeBanner) {
      storeBannerUrl = storeBanner;
    }

    const reseller = await prisma.reseller.create({
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

    return NextResponse.json(reseller, { status: 201 });
  } catch (error) {
    console.error("Error creating reseller:", error);
    return NextResponse.json({ error: "Failed to create reseller" }, { status: 500 });
  }
}
