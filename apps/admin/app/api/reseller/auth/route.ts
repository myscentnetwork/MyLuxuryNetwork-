import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Reseller authentication via username/email/phone + password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, phone, password } = body;

    if (!username && !email && !phone) {
      return NextResponse.json(
        { error: "Username, email, or phone is required" },
        { status: 400 }
      );
    }

    // Find reseller by username, email, or phone
    const reseller = await prisma.reseller.findFirst({
      where: {
        OR: [
          username ? { username: username.toLowerCase() } : {},
          email ? { email: email.toLowerCase() } : {},
          username ? { email: username.toLowerCase() } : {},
          phone ? { contactNumber: phone } : {},
          phone ? { whatsappNumber: phone } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check registration status
    if (reseller.registrationStatus === "pending") {
      return NextResponse.json(
        { error: "Your account is pending admin approval. Please wait for approval." },
        { status: 403 }
      );
    }

    if (reseller.registrationStatus === "rejected") {
      return NextResponse.json(
        { error: "Your registration was rejected. Please contact support." },
        { status: 403 }
      );
    }

    // If reseller has a password, verify it
    if (reseller.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required", requiresPassword: true },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, reseller.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("reseller_id", reseller.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      reseller: {
        id: reseller.id,
        name: reseller.name,
        email: reseller.email,
        shopName: reseller.shopName,
        username: reseller.username,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("reseller_id");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
