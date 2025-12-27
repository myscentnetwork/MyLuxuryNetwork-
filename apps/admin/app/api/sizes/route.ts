import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/sizes - List all sizes with their categories
export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include categoryIds and category names
    const transformedSizes = sizes.map((size) => ({
      ...size,
      categoryIds: size.categories.map((c) => c.categoryId),
      categoryNames: size.categories.map((c) => c.category.name),
      categories: undefined, // Remove the raw relation
    }));

    return NextResponse.json(transformedSizes);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}

// POST /api/sizes - Create one or multiple sizes with category associations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, names, status = "active", categoryIds = [] } = body;

    // Handle multiple sizes (comma-separated input)
    if (names && Array.isArray(names)) {
      // Get existing sizes to check for duplicates
      const existingSizes = await prisma.size.findMany({
        select: { name: true },
      });
      const existingNames = new Set(
        existingSizes.map((s) => s.name.toLowerCase())
      );

      // Separate new sizes from existing ones
      const toCreate: string[] = [];
      const skipped: string[] = [];

      for (const sizeName of names) {
        if (existingNames.has(sizeName.toLowerCase())) {
          skipped.push(sizeName);
        } else {
          toCreate.push(sizeName);
          existingNames.add(sizeName.toLowerCase()); // Prevent duplicates in same batch
        }
      }

      // Create new sizes with category associations
      if (toCreate.length > 0) {
        // Cannot use createMany with nested creates, so create individually
        for (const sizeName of toCreate) {
          await prisma.size.create({
            data: {
              name: sizeName,
              status,
              categories: {
                create: categoryIds.map((categoryId: string) => ({ categoryId })),
              },
            },
          });
        }
      }

      return NextResponse.json(
        {
          created: toCreate,
          skipped: skipped,
          message:
            skipped.length > 0
              ? `Created ${toCreate.length} sizes, skipped ${skipped.length} duplicates`
              : `Created ${toCreate.length} sizes`,
        },
        { status: 201 }
      );
    }

    // Handle single size (backward compatibility)
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if size already exists
    const existingSizes = await prisma.size.findMany({
      select: { name: true },
    });
    const nameExists = existingSizes.some(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      return NextResponse.json(
        { error: "Size already exists", skipped: [name], created: [] },
        { status: 409 }
      );
    }

    const size = await prisma.size.create({
      data: {
        name,
        status,
        categories: {
          create: categoryIds.map((categoryId: string) => ({ categoryId })),
        },
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

    return NextResponse.json(
      {
        ...size,
        categoryIds: size.categories.map((c) => c.categoryId),
        categoryNames: size.categories.map((c) => c.category.name),
        categories: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating size:", error);
    return NextResponse.json({ error: "Failed to create size" }, { status: 500 });
  }
}
