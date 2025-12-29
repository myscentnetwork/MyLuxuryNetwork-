import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/brands - List all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        categories: {
          include: { category: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = brands.map((brand: typeof brands[number]) => ({
      ...brand,
      categoryIds: brand.categories.map((c: { categoryId: string }) => c.categoryId),
      productCount: brand._count.products,
    }));

    // Add cache headers for faster navigation
    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logo, status = "active", categoryIds = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if brand with same name already exists (case-insensitive for SQLite)
    const allBrands = await prisma.brand.findMany({
      select: { name: true },
    });
    const existingBrand = allBrands.find(
      (b) => b.name.toLowerCase() === name.toLowerCase()
    );

    if (existingBrand) {
      return NextResponse.json({ error: "Brand name already exists" }, { status: 400 });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Upload logo to Cloudinary if it's a base64 string
    let logoUrl: string | null = logo || null;
    if (logo && logo.startsWith("data:")) {
      const result = await uploadImage(logo, "myluxury/brands");
      // Use Cloudinary URL if available, otherwise store base64 directly
      logoUrl = result?.url || logo;
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logo: logoUrl,
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
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      ...brand,
      categoryIds: brand.categories.map((c: { categoryId: string }) => c.categoryId),
      productCount: brand._count.products,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
