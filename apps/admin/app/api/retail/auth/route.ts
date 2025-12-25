import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/retail/auth - Authenticate retailer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find retailer by username or email
    const retailer = await prisma.retailer.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      },
    });

    if (!retailer) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!retailer.password) {
      return NextResponse.json(
        { error: "Account not set up for password login" },
        { status: 401 }
      );
    }

    // Compare password
    const isValid = await bcrypt.compare(password, retailer.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if approved
    if (retailer.registrationStatus !== "approved") {
      return NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      retailer: {
        id: retailer.id,
        name: retailer.name,
        username: retailer.username,
        email: retailer.email,
      },
    });
  } catch (error) {
    console.error("Retail auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
