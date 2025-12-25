import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// GET /api/portal/settings - Get user settings
export async function GET() {
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

    let user = null;

    if (userType === "reseller") {
      user = await prisma.reseller.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          shopName: true,
          contactNumber: true,
          whatsappNumber: true,
          storeAddress: true,
          storeLogo: true,
          storeBanner: true,
          tagline: true,
          instagramHandle: true,
          facebookHandle: true,
          youtubeHandle: true,
          telegramHandle: true,
        },
      });
    } else if (userType === "wholesaler") {
      user = await prisma.wholesaler.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          companyName: true,
          contactNumber: true,
          whatsappNumber: true,
          address: true,
          city: true,
          storeLogo: true,
          storeBanner: true,
          tagline: true,
          instagramHandle: true,
          facebookHandle: true,
          youtubeHandle: true,
          telegramHandle: true,
        },
      });
    } else if (userType === "retailer") {
      user = await prisma.retailer.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          contactNumber: true,
          whatsappNumber: true,
          address: true,
          city: true,
          storeLogo: true,
          storeBanner: true,
          tagline: true,
          instagramHandle: true,
          facebookHandle: true,
          youtubeHandle: true,
          telegramHandle: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user, userType });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/portal/settings - Update user settings
export async function PUT(request: Request) {
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

    const data = await request.json();

    // Validate store URL (username)
    if (data.username) {
      // Remove spaces and special characters, convert to lowercase
      const cleanSlug = data.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 30);

      if (cleanSlug.length < 3) {
        return NextResponse.json(
          { error: "Store URL must be at least 3 characters" },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingReseller = await prisma.reseller.findUnique({
        where: { username: cleanSlug },
      });
      const existingWholesaler = await prisma.wholesaler.findUnique({
        where: { username: cleanSlug },
      });
      const existingRetailer = await prisma.retailer.findUnique({
        where: { username: cleanSlug },
      });

      const isOwnUsername =
        (userType === "reseller" && existingReseller?.id === userId) ||
        (userType === "wholesaler" && existingWholesaler?.id === userId) ||
        (userType === "retailer" && existingRetailer?.id === userId);

      if (
        (existingReseller || existingWholesaler || existingRetailer) &&
        !isOwnUsername
      ) {
        return NextResponse.json(
          { error: "This store URL is already taken" },
          { status: 400 }
        );
      }

      data.username = cleanSlug;
    }

    // Validate Shop Name / Company Name for duplicates
    const shopOrCompanyName = data.shopName || data.companyName;
    if (shopOrCompanyName && shopOrCompanyName.trim().length > 0) {
      const trimmedName = shopOrCompanyName.trim().toLowerCase();

      // Check across all user types (case-insensitive via toLowerCase comparison)
      const allResellers = await prisma.reseller.findMany({
        where: { shopName: { not: null } },
        select: { id: true, shopName: true },
      });
      const allWholesalers = await prisma.wholesaler.findMany({
        where: { companyName: { not: null } },
        select: { id: true, companyName: true },
      });

      const existingResellerByShop = allResellers.find(
        (r) => r.shopName?.toLowerCase() === trimmedName
      );
      const existingWholesalerByCompany = allWholesalers.find(
        (w) => w.companyName?.toLowerCase() === trimmedName
      );

      const isOwnShopName =
        (userType === "reseller" && existingResellerByShop?.id === userId) ||
        (userType === "wholesaler" && existingWholesalerByCompany?.id === userId);

      if ((existingResellerByShop || existingWholesalerByCompany) && !isOwnShopName) {
        return NextResponse.json(
          { error: "This shop/company name is already registered" },
          { status: 400 }
        );
      }
    }

    // Validate Contact Number for duplicates
    if (data.contactNumber && data.contactNumber.trim().length > 0) {
      const trimmedContact = data.contactNumber.trim();

      const existingResellerByContact = await prisma.reseller.findFirst({
        where: { contactNumber: trimmedContact },
      });
      const existingWholesalerByContact = await prisma.wholesaler.findFirst({
        where: { contactNumber: trimmedContact },
      });
      const existingRetailerByContact = await prisma.retailer.findFirst({
        where: { contactNumber: trimmedContact },
      });

      const isOwnContact =
        (userType === "reseller" && existingResellerByContact?.id === userId) ||
        (userType === "wholesaler" && existingWholesalerByContact?.id === userId) ||
        (userType === "retailer" && existingRetailerByContact?.id === userId);

      if (
        (existingResellerByContact || existingWholesalerByContact || existingRetailerByContact) &&
        !isOwnContact
      ) {
        return NextResponse.json(
          { error: "This contact number is already registered with another account" },
          { status: 400 }
        );
      }
    }

    // Validate WhatsApp Number for duplicates
    if (data.whatsappNumber && data.whatsappNumber.trim().length > 0) {
      const trimmedWhatsapp = data.whatsappNumber.trim();

      const existingResellerByWhatsapp = await prisma.reseller.findFirst({
        where: { whatsappNumber: trimmedWhatsapp },
      });
      const existingWholesalerByWhatsapp = await prisma.wholesaler.findFirst({
        where: { whatsappNumber: trimmedWhatsapp },
      });
      const existingRetailerByWhatsapp = await prisma.retailer.findFirst({
        where: { whatsappNumber: trimmedWhatsapp },
      });

      const isOwnWhatsapp =
        (userType === "reseller" && existingResellerByWhatsapp?.id === userId) ||
        (userType === "wholesaler" && existingWholesalerByWhatsapp?.id === userId) ||
        (userType === "retailer" && existingRetailerByWhatsapp?.id === userId);

      if (
        (existingResellerByWhatsapp || existingWholesalerByWhatsapp || existingRetailerByWhatsapp) &&
        !isOwnWhatsapp
      ) {
        return NextResponse.json(
          { error: "This WhatsApp number is already registered with another account" },
          { status: 400 }
        );
      }
    }

    let updatedUser = null;

    if (userType === "reseller") {
      updatedUser = await prisma.reseller.update({
        where: { id: userId },
        data: {
          username: data.username,
          shopName: data.shopName,
          contactNumber: data.contactNumber,
          whatsappNumber: data.whatsappNumber,
          storeAddress: data.storeAddress,
          storeLogo: data.storeLogo,
          storeBanner: data.storeBanner,
          tagline: data.tagline,
          instagramHandle: data.instagramHandle,
          facebookHandle: data.facebookHandle,
          youtubeHandle: data.youtubeHandle,
          telegramHandle: data.telegramHandle,
        },
      });
    } else if (userType === "wholesaler") {
      updatedUser = await prisma.wholesaler.update({
        where: { id: userId },
        data: {
          username: data.username,
          companyName: data.companyName,
          contactNumber: data.contactNumber,
          whatsappNumber: data.whatsappNumber,
          address: data.address,
          city: data.city,
          storeLogo: data.storeLogo,
          storeBanner: data.storeBanner,
          tagline: data.tagline,
          instagramHandle: data.instagramHandle,
          facebookHandle: data.facebookHandle,
          youtubeHandle: data.youtubeHandle,
          telegramHandle: data.telegramHandle,
        },
      });
    } else if (userType === "retailer") {
      updatedUser = await prisma.retailer.update({
        where: { id: userId },
        data: {
          username: data.username,
          contactNumber: data.contactNumber,
          whatsappNumber: data.whatsappNumber,
          address: data.address,
          city: data.city,
          storeLogo: data.storeLogo,
          storeBanner: data.storeBanner,
          tagline: data.tagline,
          instagramHandle: data.instagramHandle,
          facebookHandle: data.facebookHandle,
          youtubeHandle: data.youtubeHandle,
          telegramHandle: data.telegramHandle,
        },
      });
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
