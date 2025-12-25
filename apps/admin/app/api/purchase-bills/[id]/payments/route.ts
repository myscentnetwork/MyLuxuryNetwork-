import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/purchase-bills/[id]/payments - Get all payments for a bill
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payments = await prisma.purchasePayment.findMany({
      where: { purchaseBillId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/purchase-bills/[id]/payments - Add a payment to a bill
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, transactionDetails, notes, paymentDate, paymentTime } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    if (!paymentMode) {
      return NextResponse.json({ error: "Payment mode is required" }, { status: 400 });
    }

    // Get the current bill
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!bill) {
      return NextResponse.json({ error: "Purchase bill not found" }, { status: 404 });
    }

    // Calculate total including expenses
    const expenses = (bill.shippingCharges || 0) + (bill.miscellaneous || 0) + (bill.originalBox || 0);
    const totalWithExpenses = bill.totalAmount + expenses;

    // Calculate current paid amount from existing payments
    const currentPaidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaidAmount = currentPaidAmount + amount;
    const newBalanceAmount = totalWithExpenses - newPaidAmount;

    // Calculate current balance (total with expenses - paid)
    const currentBalance = totalWithExpenses - currentPaidAmount;

    // Check if payment exceeds balance
    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance. Maximum allowed: ${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create the payment entry
    const payment = await prisma.purchasePayment.create({
      data: {
        purchaseBillId: id,
        amount,
        paymentMode,
        transactionDetails: transactionDetails || null,
        notes: notes || null,
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        paymentTime: paymentTime || null,
      },
    });

    // Update the bill's paidAmount, balanceAmount, and status
    await prisma.purchaseBill.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount <= 0 ? "paid" : "pending",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}
