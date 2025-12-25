import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

// GET /api/categories/[id] - Get a single category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        sizes: {
          include: { size: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...category,
      sizeIds: category.sizes.map((s: { sizeId: string }) => s.sizeId),
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, logo, status, sizeIds } = body;

    // Upload logo to Cloudinary if it's a new base64 string
    let logoUrl = logo || null;
    if (logo && logo.startsWith("data:")) {
      const result = await uploadImage(logo, "myluxury/categories");
      // Use Cloudinary URL if available, otherwise store base64 directly
      logoUrl = result?.url || logo;
    }

    // Update category with new sizes
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        logo: logoUrl,
        status,
        sizes: sizeIds ? {
          deleteMany: {},
          create: sizeIds.map((sizeId: string) => ({
            sizeId,
          })),
        } : undefined,
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
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
