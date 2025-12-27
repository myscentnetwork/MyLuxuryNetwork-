import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/wholesalers/register - Register a new wholesaler
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
    const existingEmail = await prisma.wholesaler.findFirst({
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
    const existingPhone = await prisma.wholesaler.findFirst({
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

    // Generate username from name
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, "").substring(0, 20);
    let username = baseUsername;
    let counter = 1;

    // Check for unique username
    while (await prisma.wholesaler.findFirst({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create wholesaler with pending registration status
    const wholesaler = await prisma.wholesaler.create({
      data: {
        name,
        email: email.toLowerCase(),
        contactNumber,
        password: hashedPassword,
        username,
        status: "inactive",
        registrationStatus: "pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! Please wait for admin approval.",
        wholesaler: {
          id: wholesaler.id,
          name: wholesaler.name,
          email: wholesaler.email,
          username: wholesaler.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering wholesaler:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
