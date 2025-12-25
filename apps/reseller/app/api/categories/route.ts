import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { cookies } from "next/headers";

// Helper to get reseller from cookie
async function getResellerId() {
  const cookieStore = await cookies();
  return cookieStore.get("reseller_id")?.value;
}

// GET /api/categories - Get available categories and reseller's selected categories
export async function GET() {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get all active categories
    const allCategories = await prisma.category.findMany({
      where: { status: "active" },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get reseller's selected categories
    const selectedCategories = await prisma.resellerCategory.findMany({
      where: { resellerId },
      select: { categoryId: true },
    });

    const selectedCategoryIds = new Set(
      selectedCategories.map((sc) => sc.categoryId)
    );

    const categories = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      logo: cat.logo,
      productCount: cat._count.products,
      isSelected: selectedCategoryIds.has(cat.id),
    }));

    return NextResponse.json({
      categories,
      selectedCount: selectedCategories.length,
    });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Update reseller's selected categories
export async function POST(request: NextRequest) {
  try {
    const resellerId = await getResellerId();

    if (!resellerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryIds } = body;

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: "Category IDs are required" },
        { status: 400 }
      );
    }

    // Delete existing selections
    await prisma.resellerCategory.deleteMany({
      where: { resellerId },
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
      selectedCount: categoryIds.length,
    });
  } catch (error) {
    console.error("Update categories error:", error);
    return NextResponse.json(
      { error: "Failed to update categories" },
      { status: 500 }
    );
  }
}
