import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Fetch all user types
    const [wholesalers, resellers, retailers] = await Promise.all([
      prisma.wholesaler.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.reseller.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.retailer.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Combine and normalize user data
    const users = [
      ...wholesalers.map((w) => ({
        id: w.id,
        name: w.name,
        username: w.username,
        email: w.email,
        phone: w.contactNumber,
        companyName: w.companyName,
        city: w.city,
        userType: "wholesaler" as const,
        status: w.status,
        registrationStatus: w.registrationStatus,
        createdAt: w.createdAt,
      })),
      ...resellers.map((r) => ({
        id: r.id,
        name: r.name,
        username: r.username,
        email: r.email,
        phone: r.contactNumber,
        companyName: r.shopName,
        city: null,
        userType: "reseller" as const,
        status: r.status,
        registrationStatus: r.registrationStatus,
        createdAt: r.createdAt,
      })),
      ...retailers.map((r) => ({
        id: r.id,
        name: r.name,
        username: r.username,
        email: r.email,
        phone: r.contactNumber,
        companyName: null,
        city: r.city,
        userType: "retailer" as const,
        status: r.status,
        registrationStatus: r.registrationStatus,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, currentType, newType, status } = await request.json();

    if (!userId || !currentType) {
      return NextResponse.json(
        { error: "User ID and current type are required" },
        { status: 400 }
      );
    }

    // If just updating status (not changing type)
    if (!newType || newType === currentType) {
      const updateData: Record<string, string> = {};
      if (status) updateData.status = status;

      let updatedUser;
      if (currentType === "wholesaler") {
        updatedUser = await prisma.wholesaler.update({
          where: { id: userId },
          data: updateData,
        });
      } else if (currentType === "reseller") {
        updatedUser = await prisma.reseller.update({
          where: { id: userId },
          data: updateData,
        });
      } else if (currentType === "retailer") {
        updatedUser = await prisma.retailer.update({
          where: { id: userId },
          data: updateData,
        });
      }

      return NextResponse.json({ success: true, user: updatedUser });
    }

    // Type change requires migration of user data
    // Get current user data
    let userData: {
      name: string;
      username: string | null;
      email: string | null;
      password: string | null;
      contactNumber: string | null;
      whatsappNumber: string | null;
      status: string;
      registrationStatus: string;
    } | null = null;

    if (currentType === "wholesaler") {
      const user = await prisma.wholesaler.findUnique({ where: { id: userId } });
      if (user) {
        userData = {
          name: user.name,
          username: user.username,
          email: user.email,
          password: user.password,
          contactNumber: user.contactNumber,
          whatsappNumber: user.whatsappNumber,
          status: user.status,
          registrationStatus: user.registrationStatus,
        };
      }
    } else if (currentType === "reseller") {
      const user = await prisma.reseller.findUnique({ where: { id: userId } });
      if (user) {
        userData = {
          name: user.name,
          username: user.username,
          email: user.email,
          password: user.password,
          contactNumber: user.contactNumber,
          whatsappNumber: user.whatsappNumber,
          status: user.status,
          registrationStatus: user.registrationStatus,
        };
      }
    } else if (currentType === "retailer") {
      const user = await prisma.retailer.findUnique({ where: { id: userId } });
      if (user) {
        userData = {
          name: user.name,
          username: user.username,
          email: user.email,
          password: user.password,
          contactNumber: user.contactNumber,
          whatsappNumber: user.whatsappNumber,
          status: user.status,
          registrationStatus: user.registrationStatus,
        };
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create user in new type table
    let newUser;
    if (newType === "wholesaler") {
      newUser = await prisma.wholesaler.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          contactNumber: userData.contactNumber,
          whatsappNumber: userData.whatsappNumber,
          status: status || userData.status,
          registrationStatus: userData.registrationStatus,
        },
      });
    } else if (newType === "reseller") {
      newUser = await prisma.reseller.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          contactNumber: userData.contactNumber,
          whatsappNumber: userData.whatsappNumber,
          status: status || userData.status,
          registrationStatus: userData.registrationStatus,
        },
      });
    } else if (newType === "retailer") {
      newUser = await prisma.retailer.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          contactNumber: userData.contactNumber,
          whatsappNumber: userData.whatsappNumber,
          status: status || userData.status,
          registrationStatus: userData.registrationStatus,
        },
      });
    }

    // Delete from old type table
    if (currentType === "wholesaler") {
      await prisma.wholesaler.delete({ where: { id: userId } });
    } else if (currentType === "reseller") {
      await prisma.reseller.delete({ where: { id: userId } });
    } else if (currentType === "retailer") {
      await prisma.retailer.delete({ where: { id: userId } });
    }

    return NextResponse.json({ success: true, user: newUser, typeChanged: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
