import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/register - Self-register as a reseller
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      confirmPassword,
      contactNumber,
      whatsappNumber,
      shopName,
      storeAddress,
      customDomain,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      telegramHandle,
      storeLogo,
      storeBanner,
    } = body;

    // Validation
    if (!name || !email || !password || !contactNumber) {
      return NextResponse.json(
        { error: "Name, email, password, and contact number are required" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.reseller.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // Check if shop name already exists (only if provided)
    if (shopName) {
      const existingShopName = await prisma.reseller.findFirst({
        where: { shopName: { equals: shopName } },
      });
      if (existingShopName) {
        return NextResponse.json(
          { error: "Shop name is already taken" },
          { status: 409 }
        );
      }
    }

    // Check if contact number already exists
    const existingContact = await prisma.reseller.findFirst({
      where: { contactNumber: contactNumber },
    });
    if (existingContact) {
      return NextResponse.json(
        { error: "Contact number is already registered" },
        { status: 409 }
      );
    }

    // Generate username from shop name or email
    const username = shopName
      ? shopName.toLowerCase().replace(/\s+/g, "")
      : email.toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");

    // Check if username already exists
    const existingUsername = await prisma.reseller.findFirst({
      where: { username: username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: shopName
          ? "This shop name generates a username that is already taken. Please choose a different shop name."
          : "Username derived from email is already taken. Please use a different email or contact support."
        },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the reseller with pending status
    const reseller = await prisma.reseller.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        contactNumber,
        whatsappNumber: whatsappNumber || null,
        shopName: shopName || null,
        username,
        storeAddress: storeAddress || null,
        customDomain: customDomain || null,
        instagramHandle: instagramHandle || null,
        facebookHandle: facebookHandle || null,
        youtubeHandle: youtubeHandle || null,
        telegramHandle: telegramHandle || null,
        storeLogo: storeLogo || null,
        storeBanner: storeBanner || null,
        status: "inactive", // Inactive until approved
        registrationStatus: "pending", // Requires admin approval
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully! Your account is pending admin approval.",
        resellerId: reseller.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering reseller:", error);
    return NextResponse.json(
      { error: "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
