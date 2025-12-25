import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/brands/[id] - Get a single brand
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...brand,
      categoryIds: brand.categories.map((c: { categoryId: string }) => c.categoryId),
      productCount: brand._count.products,
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
  }
}

// PUT /api/brands/[id] - Update a brand
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, logo, status, categoryIds } = body;

    // Check if another brand with same name exists (case-insensitive for SQLite)
    if (name) {
      const allBrands = await prisma.brand.findMany({
        where: { NOT: { id } },
        select: { name: true },
      });
      const existingBrand = allBrands.find(
        (b) => b.name.toLowerCase() === name.toLowerCase()
      );

      if (existingBrand) {
        return NextResponse.json({ error: "Brand name already exists" }, { status: 400 });
      }
    }

    // Generate new slug if name changed
    const slug = name ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : undefined;

    // Upload logo to Cloudinary if it's a new base64 string
    let logoUrl = logo || null;
    if (logo && logo.startsWith("data:")) {
      const result = await uploadImage(logo, "myluxury/brands");
      // Use Cloudinary URL if available, otherwise store base64 directly
      logoUrl = result?.url || logo;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        slug,
        logo: logoUrl,
        status,
        categories: categoryIds ? {
          deleteMany: {},
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        } : undefined,
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
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
  }
}

// DELETE /api/brands/[id] - Delete a brand
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
