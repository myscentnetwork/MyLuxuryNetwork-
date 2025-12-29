import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        sizes: {
          include: { size: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend expected format
    const transformed = categories.map((cat: typeof categories[number]) => ({
      ...cat,
      sizeIds: cat.sizes.map((s: { sizeId: string }) => s.sizeId),
    }));

    // Add cache headers for faster navigation
    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logo, status = "active", sizeIds = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Upload logo to Cloudinary if it's a base64 string
    let logoUrl: string | null = logo || null;
    if (logo && logo.startsWith("data:")) {
      const result = await uploadImage(logo, "myluxury/categories");
      // Use Cloudinary URL if available, otherwise store base64 directly
      logoUrl = result?.url || logo;
    }

    const category = await prisma.category.create({
      data: {
        name,
        logo: logoUrl,
        status,
        sizes: {
          create: sizeIds.map((sizeId: string) => ({
            sizeId,
          })),
        },
      },
      include: {
        sizes: {
          include: { size: true },
        },
      },
    });

    return NextResponse.json({
      ...category,
      sizeIds: category.sizes.map((s: { sizeId: string }) => s.sizeId),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
