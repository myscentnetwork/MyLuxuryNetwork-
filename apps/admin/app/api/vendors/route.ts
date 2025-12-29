import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/vendors - List all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        categories: {
          include: { category: true },
        },
        _count: { select: { purchaseBills: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = vendors.map((v: typeof vendors[number]) => ({
      ...v,
      categoryIds: v.categories.map((c: { categoryId: string; category: { name: string } }) => c.categoryId),
      categoryNames: v.categories.map((c: { categoryId: string; category: { name: string } }) => c.category.name),
      billCount: v._count.purchaseBills,
    }));

    // Add cache headers for faster navigation
    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city, status = "active", categoryIds = [] } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!city || !city.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    // Phone format validation (allow digits, spaces, dashes, plus, parentheses)
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // Check for duplicate vendor by name (case-insensitive for SQLite)
    const allVendors = await prisma.vendor.findMany({
      select: { name: true },
    });
    const nameLower = name.trim().toLowerCase();
    const existingByName = allVendors.some(
      (v: { name: string }) => v.name.toLowerCase() === nameLower
    );

    if (existingByName) {
      return NextResponse.json({ error: "A vendor with this name already exists" }, { status: 409 });
    }

    // Check for duplicate vendor by phone
    const existingByPhone = await prisma.vendor.findFirst({
      where: {
        phone: phone.trim(),
      },
    });

    if (existingByPhone) {
      return NextResponse.json({ error: "A vendor with this phone number already exists" }, { status: 409 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        phone,
        city,
        status,
        categories: {
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json({
      ...vendor,
      categoryIds: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.categoryId),
      categoryNames: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.category.name),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
