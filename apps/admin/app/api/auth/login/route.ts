import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check Wholesaler table first
    const wholesaler = await prisma.wholesaler.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (wholesaler && wholesaler.password) {
      const isValid = await bcrypt.compare(password, wholesaler.password);
      if (isValid) {
        return NextResponse.json({
          success: true,
          user: {
            id: wholesaler.id,
            name: wholesaler.name || wholesaler.companyName || username,
            type: "wholesaler",
          },
        });
      }
    }

    // Check Reseller table
    const reseller = await prisma.reseller.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (reseller && reseller.password) {
      const isValid = await bcrypt.compare(password, reseller.password);
      if (isValid) {
        // Check registration status
        if (reseller.registrationStatus === "pending") {
          return NextResponse.json(
            { error: "Your account is pending approval. Please wait for admin approval." },
            { status: 403 }
          );
        }
        if (reseller.registrationStatus === "rejected") {
          return NextResponse.json(
            { error: "Your registration was rejected. Please contact support." },
            { status: 403 }
          );
        }
        return NextResponse.json({
          success: true,
          user: {
            id: reseller.id,
            name: reseller.name || reseller.shopName || username,
            type: "reseller",
          },
        });
      }
    }

    // Check Retailer table
    const retailer = await prisma.retailer.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (retailer && retailer.password) {
      const isValid = await bcrypt.compare(password, retailer.password);
      if (isValid) {
        return NextResponse.json({
          success: true,
          user: {
            id: retailer.id,
            name: retailer.name || username,
            type: "retailer",
          },
        });
      }
    }

    // No matching user found
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
