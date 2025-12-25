import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/wholesale/auth - Authenticate wholesaler
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

    // Find wholesaler by username or email
    const wholesaler = await prisma.wholesaler.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!wholesaler.password) {
      return NextResponse.json(
        { error: "Account not set up for password login" },
        { status: 401 }
      );
    }

    // Compare password
    const isValid = await bcrypt.compare(password, wholesaler.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if approved
    if (wholesaler.registrationStatus !== "approved") {
      return NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      wholesaler: {
        id: wholesaler.id,
        name: wholesaler.name,
        username: wholesaler.username,
        email: wholesaler.email,
      },
    });
  } catch (error) {
    console.error("Wholesale auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
