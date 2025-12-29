import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// Get user info from cookies
async function getUserFromCookies() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  const userType = cookieStore.get("user_type")?.value;

  return { userId, userType };
}

// Helper to get reseller stats using parallel count/aggregate queries
async function getResellerStats(userId: string, today: Date, tomorrow: Date, monthStart: Date, monthEnd: Date) {
  const [
    // Product counts - all in parallel
    storeProducts,
    visibleProducts,
    inStockProducts,
    outOfStockProducts,
    // Order counts
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    // Revenue aggregations
    totalRevenue,
    todayRevenue,
    monthRevenue,
    pendingRevenue,
  ] = await Promise.all([
    // Product counts
    prisma.resellerProduct.count({ where: { resellerId: userId } }),
    prisma.resellerProduct.count({ where: { resellerId: userId, isVisible: true } }),
    prisma.resellerProduct.count({ where: { resellerId: userId, product: { status: "in_stock" } } }),
    prisma.resellerProduct.count({ where: { resellerId: userId, product: { status: "out_of_stock" } } }),
    // Order counts
    prisma.orderBill.count({ where: { userId, userType: "reseller" } }),
    prisma.orderBill.count({ where: { userId, userType: "reseller", createdAt: { gte: today, lt: tomorrow } } }),
    prisma.orderBill.count({ where: { userId, userType: "reseller", createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.orderBill.count({ where: { userId, userType: "reseller", status: "pending" } }),
    prisma.orderBill.count({ where: { userId, userType: "reseller", status: { in: ["paid", "delivered"] } } }),
    prisma.orderBill.count({ where: { userId, userType: "reseller", status: "cancelled" } }),
    // Revenue aggregations
    prisma.orderBill.aggregate({ where: { userId, userType: "reseller", status: { not: "cancelled" } }, _sum: { grandTotal: true } }),
    prisma.orderBill.aggregate({ where: { userId, userType: "reseller", status: { not: "cancelled" }, createdAt: { gte: today, lt: tomorrow } }, _sum: { grandTotal: true } }),
    prisma.orderBill.aggregate({ where: { userId, userType: "reseller", status: { not: "cancelled" }, createdAt: { gte: monthStart, lt: monthEnd } }, _sum: { grandTotal: true } }),
    prisma.orderBill.aggregate({ where: { userId, userType: "reseller", status: "pending" }, _sum: { grandTotal: true } }),
  ]);

  return {
    storeProducts,
    visibleProducts,
    hiddenProducts: storeProducts - visibleProducts,
    inStockProducts,
    outOfStockProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.grandTotal || 0,
    todayRevenue: todayRevenue._sum.grandTotal || 0,
    monthRevenue: monthRevenue._sum.grandTotal || 0,
    pendingRevenue: pendingRevenue._sum.grandTotal || 0,
    estimatedProfit: 0,
    todayProfit: 0,
    monthProfit: 0,
  };
}

// Helper to get wholesaler stats using parallel count/aggregate queries
async function getWholesalerStats(userId: string, today: Date, tomorrow: Date, monthStart: Date, monthEnd: Date) {
  const [
    storeProducts,
    visibleProducts,
    inStockProducts,
    outOfStockProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    pendingRevenue,
  ] = await Promise.all([
    prisma.wholesalerProduct.count({ where: { wholesalerId: userId } }),
    prisma.wholesalerProduct.count({ where: { wholesalerId: userId, isVisible: true } }),
    prisma.wholesalerProduct.count({ where: { wholesalerId: userId, product: { status: "in_stock" } } }),
    prisma.wholesalerProduct.count({ where: { wholesalerId: userId, product: { status: "out_of_stock" } } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId, createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId, status: "pending" } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId, status: { in: ["paid", "delivered"] } } }),
    prisma.wholesaleOrderBill.count({ where: { wholesalerId: userId, status: "cancelled" } }),
    prisma.wholesaleOrderBill.aggregate({ where: { wholesalerId: userId, status: { not: "cancelled" } }, _sum: { grandTotal: true } }),
    prisma.wholesaleOrderBill.aggregate({ where: { wholesalerId: userId, status: { not: "cancelled" }, createdAt: { gte: today, lt: tomorrow } }, _sum: { grandTotal: true } }),
    prisma.wholesaleOrderBill.aggregate({ where: { wholesalerId: userId, status: { not: "cancelled" }, createdAt: { gte: monthStart, lt: monthEnd } }, _sum: { grandTotal: true } }),
    prisma.wholesaleOrderBill.aggregate({ where: { wholesalerId: userId, status: "pending" }, _sum: { grandTotal: true } }),
  ]);

  return {
    storeProducts,
    visibleProducts,
    hiddenProducts: storeProducts - visibleProducts,
    inStockProducts,
    outOfStockProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.grandTotal || 0,
    todayRevenue: todayRevenue._sum.grandTotal || 0,
    monthRevenue: monthRevenue._sum.grandTotal || 0,
    pendingRevenue: pendingRevenue._sum.grandTotal || 0,
    estimatedProfit: 0,
    todayProfit: 0,
    monthProfit: 0,
  };
}

// Helper to get retailer stats using parallel count/aggregate queries
async function getRetailerStats(userId: string, today: Date, tomorrow: Date, monthStart: Date, monthEnd: Date) {
  const [
    storeProducts,
    visibleProducts,
    inStockProducts,
    outOfStockProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    pendingRevenue,
  ] = await Promise.all([
    prisma.retailerProduct.count({ where: { retailerId: userId } }),
    prisma.retailerProduct.count({ where: { retailerId: userId, isVisible: true } }),
    prisma.retailerProduct.count({ where: { retailerId: userId, product: { status: "in_stock" } } }),
    prisma.retailerProduct.count({ where: { retailerId: userId, product: { status: "out_of_stock" } } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId, createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId, status: "pending" } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId, status: { in: ["paid", "delivered"] } } }),
    prisma.retailOrderBill.count({ where: { retailerId: userId, status: "cancelled" } }),
    prisma.retailOrderBill.aggregate({ where: { retailerId: userId, status: { not: "cancelled" } }, _sum: { grandTotal: true } }),
    prisma.retailOrderBill.aggregate({ where: { retailerId: userId, status: { not: "cancelled" }, createdAt: { gte: today, lt: tomorrow } }, _sum: { grandTotal: true } }),
    prisma.retailOrderBill.aggregate({ where: { retailerId: userId, status: { not: "cancelled" }, createdAt: { gte: monthStart, lt: monthEnd } }, _sum: { grandTotal: true } }),
    prisma.retailOrderBill.aggregate({ where: { retailerId: userId, status: "pending" }, _sum: { grandTotal: true } }),
  ]);

  return {
    storeProducts,
    visibleProducts,
    hiddenProducts: storeProducts - visibleProducts,
    inStockProducts,
    outOfStockProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.grandTotal || 0,
    todayRevenue: todayRevenue._sum.grandTotal || 0,
    monthRevenue: monthRevenue._sum.grandTotal || 0,
    pendingRevenue: pendingRevenue._sum.grandTotal || 0,
    estimatedProfit: 0,
    todayProfit: 0,
    monthProfit: 0,
  };
}

// GET /api/portal/dashboard-stats - Get dashboard statistics for the logged-in user
// OPTIMIZED: Uses Promise.all for parallel DB count/aggregate queries instead of JS filtering
export async function GET() {
  try {
    const { userId, userType } = await getUserFromCookies();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    let stats;

    if (userType === "reseller") {
      stats = await getResellerStats(userId, today, tomorrow, monthStart, monthEnd);
    } else if (userType === "wholesaler") {
      stats = await getWholesalerStats(userId, today, tomorrow, monthStart, monthEnd);
    } else if (userType === "retailer") {
      stats = await getRetailerStats(userId, today, tomorrow, monthStart, monthEnd);
    } else {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
