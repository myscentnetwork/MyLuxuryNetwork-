import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/store/[username] - Get store data by username
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Try to find the store in resellers
    let store = await prisma.reseller.findUnique({
      where: { username: slug },
      select: {
        id: true,
        username: true,
        name: true,
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
        status: true,
        registrationStatus: true,
      },
    });

    let storeType = "reseller";

    // If not found in resellers, try wholesalers
    if (!store) {
      const wholesaler = await prisma.wholesaler.findUnique({
        where: { username: slug },
        select: {
          id: true,
          username: true,
          name: true,
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
          status: true,
          registrationStatus: true,
        },
      });

      if (wholesaler) {
        store = {
          ...wholesaler,
          shopName: wholesaler.companyName,
          storeAddress: wholesaler.address,
        };
        storeType = "wholesaler";
      }
    }

    // If not found in wholesalers, try retailers
    if (!store) {
      const retailer = await prisma.retailer.findUnique({
        where: { username: slug },
        select: {
          id: true,
          username: true,
          name: true,
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
          status: true,
          registrationStatus: true,
        },
      });

      if (retailer) {
        store = {
          ...retailer,
          shopName: retailer.name,
          storeAddress: retailer.address,
        };
        storeType = "retailer";
      }
    }

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check if store is active
    if (store.status !== "active" || store.registrationStatus !== "approved") {
      return NextResponse.json(
        { error: "Store is not active" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      store: {
        ...store,
        storeType,
      },
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}
