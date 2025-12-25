import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/vendors/[id] - Get a single vendor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...vendor,
      categoryIds: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.categoryId),
      categoryNames: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.category.name),
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}

// PUT /api/vendors/[id] - Update a vendor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, city, status, categoryIds } = body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name,
        phone,
        city,
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
      },
    });

    return NextResponse.json({
      ...vendor,
      categoryIds: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.categoryId),
      categoryNames: vendor.categories.map((c: { categoryId: string; category: { name: string } }) => c.category.name),
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
