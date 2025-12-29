import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/wholesalers - List all wholesalers
export async function GET() {
  try {
    const wholesalers = await prisma.wholesaler.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Add cache headers for faster navigation
    return NextResponse.json(wholesalers, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error("Error fetching wholesalers:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesalers" },
      { status: 500 }
    );
  }
}

// POST /api/wholesalers - Create a new wholesaler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      companyName,
      contactNumber,
      whatsappNumber,
      email,
      address,
      city,
      gstNumber,
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

    // Generate username from company name or name
    const baseName = companyName || name;
    const username = baseName.toLowerCase().replace(/\s+/g, "");

    // Check if username already exists
    const existingUsername = await prisma.wholesaler.findUnique({
      where: { username },
    });

    let finalUsername = username;
    if (existingUsername) {
      finalUsername = `${username}${Date.now().toString().slice(-4)}`;
    }

    const wholesaler = await prisma.wholesaler.create({
      data: {
        username: finalUsername,
        name,
        companyName: companyName || null,
        contactNumber: contactNumber || null,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        address: address || null,
        city: city || null,
        gstNumber: gstNumber || null,
        status: status || "inactive",
        registrationStatus: "approved",
        instagramHandle: instagramHandle || null,
        facebookHandle: facebookHandle || null,
        youtubeHandle: youtubeHandle || null,
        telegramHandle: telegramHandle || null,
      },
    });

    return NextResponse.json(wholesaler, { status: 201 });
  } catch (error) {
    console.error("Error creating wholesaler:", error);
    return NextResponse.json(
      { error: "Failed to create wholesaler" },
      { status: 500 }
    );
  }
}
