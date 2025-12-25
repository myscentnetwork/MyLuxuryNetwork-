import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/sizes - List all sizes
export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sizes);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}

// POST /api/sizes - Create one or multiple sizes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, names, status = "active" } = body;

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

      // Create new sizes
      if (toCreate.length > 0) {
        await prisma.size.createMany({
          data: toCreate.map((n) => ({ name: n, status })),
        });
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
      data: { name, status },
    });

    return NextResponse.json(size, { status: 201 });
  } catch (error) {
    console.error("Error creating size:", error);
    return NextResponse.json({ error: "Failed to create size" }, { status: 500 });
  }
}
