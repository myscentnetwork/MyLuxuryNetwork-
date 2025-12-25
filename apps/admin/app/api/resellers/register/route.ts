import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/resellers/register - Register a new reseller
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, contactNumber, password } = body;

    // Validation
    if (!name || !email || !contactNumber || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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
        { status: 400 }
      );
    }

    // Check if contact number already exists
    const cleanNumber = contactNumber.replace(/[\s\-\(\)\+]/g, "");
    const existingPhone = await prisma.reseller.findFirst({
      where: {
        OR: [
          { contactNumber: contactNumber },
          { contactNumber: cleanNumber },
          { contactNumber: `+91${cleanNumber}` },
        ],
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number is already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username from name (this is used as store URL)
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, "").substring(0, 20);
    let username = baseUsername;
    let counter = 1;

    // Check for unique username
    while (await prisma.reseller.findFirst({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create reseller with pending registration status
    const reseller = await prisma.reseller.create({
      data: {
        name,
        email: email.toLowerCase(),
        contactNumber,
        password: hashedPassword,
        username,
        status: "inactive",
        registrationStatus: "pending", // Requires admin approval
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! Please wait for admin approval.",
        reseller: {
          id: reseller.id,
          name: reseller.name,
          email: reseller.email,
          username: reseller.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering reseller:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
