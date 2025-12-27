import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/sizes/[id] - Get a single size with categories
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const size = await prisma.size.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!size) {
      return NextResponse.json({ error: "Size not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...size,
      categoryIds: size.categories.map((c) => c.categoryId),
      categoryNames: size.categories.map((c) => c.category.name),
      categories: undefined,
    });
  } catch (error) {
    console.error("Error fetching size:", error);
    return NextResponse.json({ error: "Failed to fetch size" }, { status: 500 });
  }
}

// PUT /api/sizes/[id] - Update a size with categories
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status, categoryIds } = body;

    // Check if another size with the same name exists
    if (name) {
      const allSizes = await prisma.size.findMany({
        where: { id: { not: id } },
        select: { name: true },
      });

      const nameExists = allSizes.some(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );

      if (nameExists) {
        return NextResponse.json(
          { error: "A size with this name already exists" },
          { status: 409 }
        );
      }
    }

    const size = await prisma.size.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId: string) => ({ categoryId })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...size,
      categoryIds: size.categories.map((c) => c.categoryId),
      categoryNames: size.categories.map((c) => c.category.name),
      categories: undefined,
    });
  } catch (error) {
    console.error("Error updating size:", error);
    return NextResponse.json({ error: "Failed to update size" }, { status: 500 });
  }
}

// DELETE /api/sizes/[id] - Delete a size
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.size.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting size:", error);
    return NextResponse.json({ error: "Failed to delete size" }, { status: 500 });
  }
}
