import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/check-availability - Check if field value is available
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");
    const value = searchParams.get("value");

    if (!field || !value) {
      return NextResponse.json(
        { error: "Field and value are required" },
        { status: 400 }
      );
    }

    let isTaken = false;

    switch (field) {
      case "shopName": {
        const username = value.toLowerCase().replace(/\s+/g, "");
        const existing = await prisma.reseller.findFirst({
          where: {
            OR: [
              { shopName: value },
              { username: username },
            ],
          },
        });
        isTaken = !!existing;
        break;
      }
      case "email": {
        const existing = await prisma.reseller.findFirst({
          where: { email: value.toLowerCase() },
        });
        isTaken = !!existing;
        break;
      }
      case "contactNumber": {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        const existing = await prisma.reseller.findFirst({
          where: {
            OR: [
              { contactNumber: value },
              { contactNumber: cleanNumber },
              { contactNumber: `+91${cleanNumber}` },
            ],
          },
        });
        isTaken = !!existing;
        break;
      }
      case "whatsappNumber": {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        const existing = await prisma.reseller.findFirst({
          where: {
            OR: [
              { whatsappNumber: value },
              { whatsappNumber: cleanNumber },
              { whatsappNumber: `+91${cleanNumber}` },
            ],
          },
        });
        isTaken = !!existing;
        break;
      }
      case "customDomain": {
        const existing = await prisma.reseller.findFirst({
          where: { customDomain: value.toLowerCase() },
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
