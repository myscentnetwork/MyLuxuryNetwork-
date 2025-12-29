import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/retailers - List all retailers
export async function GET() {
  try {
    const retailers = await prisma.retailer.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Add cache headers for faster navigation
    return NextResponse.json(retailers, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error("Error fetching retailers:", error);
    return NextResponse.json(
      { error: "Failed to fetch retailers" },
      { status: 500 }
    );
  }
}

// POST /api/retailers - Create a new retailer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      contactNumber,
      whatsappNumber,
      email,
      address,
      city,
      status,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      telegramHandle,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate username from name or email
    const baseName = email ? email.split("@")[0] : name;
    const username = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Check if username already exists
    const existingUsername = await prisma.retailer.findUnique({
      where: { username },
    });

    let finalUsername = username;
    if (existingUsername) {
      finalUsername = `${username}${Date.now().toString().slice(-4)}`;
    }

    const retailer = await prisma.retailer.create({
      data: {
        username: finalUsername,
        name,
        contactNumber: contactNumber || null,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        address: address || null,
        city: city || null,
        status: status || "inactive",
        registrationStatus: "approved",
        instagramHandle: instagramHandle || null,
        facebookHandle: facebookHandle || null,
        youtubeHandle: youtubeHandle || null,
        telegramHandle: telegramHandle || null,
      },
    });

    return NextResponse.json(retailer, { status: 201 });
  } catch (error) {
    console.error("Error creating retailer:", error);
    return NextResponse.json(
      { error: "Failed to create retailer" },
      { status: 500 }
    );
  }
}
