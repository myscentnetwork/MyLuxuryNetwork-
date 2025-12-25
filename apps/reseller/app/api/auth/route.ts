import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Reseller authentication via email/phone + optional password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Find reseller by email or phone
    const reseller = await prisma.reseller.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
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

// Get current reseller session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const resellerId = cookieStore.get("reseller_id")?.value;

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
      },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: "Reseller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reseller: {
        id: reseller.id,
        name: reseller.name,
        email: reseller.email,
        shopName: reseller.shopName,
        username: reseller.username,
        whatsappNumber: reseller.whatsappNumber,
        storeLogo: reseller.storeLogo,
        storeBanner: reseller.storeBanner,
        categories: reseller.selectedCategories.map((sc) => ({
          id: sc.category.id,
          name: sc.category.name,
        })),
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
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
