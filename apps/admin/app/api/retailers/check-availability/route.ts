import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/retailers/check-availability - Check if field value is available
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const contactNumber = searchParams.get("contactNumber");

    const result: { email?: boolean; contactNumber?: boolean } = {};

    if (email) {
      const existing = await prisma.retailer.findFirst({
        where: { email: email.toLowerCase() },
      });
      result.email = !existing;
    }

    if (contactNumber) {
      const cleanNumber = contactNumber.replace(/[\s\-\(\)\+]/g, "");
      const existing = await prisma.retailer.findFirst({
        where: {
          OR: [
            { contactNumber: contactNumber },
            { contactNumber: cleanNumber },
            { contactNumber: `+91${cleanNumber}` },
          ],
        },
      });
      result.contactNumber = !existing;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
