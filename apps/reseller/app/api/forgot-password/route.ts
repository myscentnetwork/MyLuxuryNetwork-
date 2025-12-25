import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

// POST /api/forgot-password - Request password reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find reseller by email
    const reseller = await prisma.reseller.findFirst({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!reseller) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.reseller.update({
      where: { id: reseller.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a real app, you would send an email here
    // For now, we'll just return the token (for development)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/reset-password?token=${resetToken}`;

    console.log("Password reset link:", resetUrl);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
      // Include reset URL in development only
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
