import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

// GET - Fetch all categories and reseller's selected categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resellerId = searchParams.get("resellerId");

    if (!resellerId) {
      return NextResponse.json(
        { error: "Reseller ID is required" },
        { status: 400 }
      );
    }

    // Fetch all active categories
    const allCategories = await prisma.category.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Fetch reseller's selected categories
    const selectedCategories = await prisma.resellerCategory.findMany({
      where: { resellerId },
      select: { categoryId: true }
    });

    const selectedCategoryIds = selectedCategories.map(sc => sc.categoryId);

    return NextResponse.json({
      categories: allCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        logo: cat.logo,
        productCount: cat._count.products,
        isSelected: selectedCategoryIds.includes(cat.id),
      })),
      selectedCount: selectedCategoryIds.length,
      totalCategories: allCategories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Select/deselect categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resellerId, categoryIds, selectAll } = body;

    if (!resellerId) {
      return NextResponse.json(
        { error: "Reseller ID is required" },
        { status: 400 }
      );
    }

    // If selectAll is true, select all active categories
    if (selectAll) {
      const allCategories = await prisma.category.findMany({
        where: { status: "active" },
        select: { id: true }
      });

      // Remove existing selections
      await prisma.resellerCategory.deleteMany({
        where: { resellerId }
      });

      // Add all categories
      await prisma.resellerCategory.createMany({
        data: allCategories.map(cat => ({
          resellerId,
          categoryId: cat.id,
        })),
      });

      return NextResponse.json({
        success: true,
        message: "All categories selected",
        selectedCount: allCategories.length,
      });
    }

    // Otherwise, set specific categories
    if (!categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: "Category IDs array is required" },
        { status: 400 }
      );
    }

    // Remove existing selections
    await prisma.resellerCategory.deleteMany({
      where: { resellerId }
    });

    // Add new selections
    if (categoryIds.length > 0) {
      await prisma.resellerCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          resellerId,
          categoryId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: `${categoryIds.length} categories selected`,
      selectedCount: categoryIds.length,
    });
  } catch (error) {
    console.error("Error updating categories:", error);
    return NextResponse.json(
      { error: "Failed to update categories" },
      { status: 500 }
    );
  }
}

// PUT - Toggle single category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { resellerId, categoryId, selected } = body;

    if (!resellerId || !categoryId) {
      return NextResponse.json(
        { error: "Reseller ID and Category ID are required" },
        { status: 400 }
      );
    }

    if (selected) {
      // Add category
      await prisma.resellerCategory.upsert({
        where: {
          resellerId_categoryId: { resellerId, categoryId }
        },
        create: { resellerId, categoryId },
        update: {},
      });
    } else {
      // Remove category
      await prisma.resellerCategory.deleteMany({
        where: { resellerId, categoryId }
      });
    }

    return NextResponse.json({
      success: true,
      message: selected ? "Category added" : "Category removed",
    });
  } catch (error) {
    console.error("Error toggling category:", error);
    return NextResponse.json(
      { error: "Failed to toggle category" },
      { status: 500 }
    );
  }
}
