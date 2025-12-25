import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/retailers/check-availability - Check if field value is available
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");
    const value = searchParams.get("value");
    const excludeId = searchParams.get("excludeId"); // For edit mode

    if (!field || !value) {
      return NextResponse.json(
        { error: "Field and value are required" },
        { status: 400 }
      );
    }

    let isTaken = false;

    switch (field) {
      case "email": {
        const existing = await prisma.retailer.findFirst({
          where: {
            email: value.toLowerCase(),
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
        });
        isTaken = !!existing;
        break;
      }
      case "contactNumber": {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        const existing = await prisma.retailer.findFirst({
          where: {
            OR: [
              { contactNumber: value },
              { contactNumber: cleanNumber },
              { contactNumber: `+91${cleanNumber}` },
            ],
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
        });
        isTaken = !!existing;
        break;
      }
      case "whatsappNumber": {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        const existing = await prisma.retailer.findFirst({
          where: {
            OR: [
              { whatsappNumber: value },
              { whatsappNumber: cleanNumber },
              { whatsappNumber: `+91${cleanNumber}` },
            ],
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
        });
        isTaken = !!existing;
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid field" },
          { status: 400 }
        );
    }

    return NextResponse.json({ available: !isTaken });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
