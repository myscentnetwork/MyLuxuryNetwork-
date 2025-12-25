import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo users...\n");

  // Delete all existing users (cascades to related tables)
  console.log("Clearing existing users...");

  await prisma.wholesalerCategory.deleteMany();
  await prisma.wholesaleOrderItem.deleteMany();
  await prisma.wholesaleOrderBill.deleteMany();
  await prisma.wholesaler.deleteMany();

  await prisma.resellerCategory.deleteMany();
  await prisma.resellerProduct.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderBill.deleteMany();
  await prisma.reseller.deleteMany();

  await prisma.retailerCategory.deleteMany();
  await prisma.retailOrderItem.deleteMany();
  await prisma.retailOrderBill.deleteMany();
  await prisma.retailer.deleteMany();

  console.log("All users cleared.\n");

  // Hash passwords
  const wholesalePassword = await bcrypt.hash("wholesale", 10);
  const resellerPassword = await bcrypt.hash("reseller", 10);
  const retailerPassword = await bcrypt.hash("retailer", 10);

  // Create Wholesaler
  console.log("Creating demo Wholesaler...");
  const wholesaler = await prisma.wholesaler.create({
    data: {
      username: "wholesale",
      name: "Demo Wholesaler",
      companyName: "Wholesale Co.",
      email: "wholesale@demo.com",
      password: wholesalePassword,
      contactNumber: "9999000001",
      status: "active",
      registrationStatus: "approved",
    },
  });
  console.log(`  Created: ${wholesaler.name} (wholesale/wholesale)\n`);

  // Create Reseller
  console.log("Creating demo Reseller...");
  const reseller = await prisma.reseller.create({
    data: {
      username: "reseller",
      name: "Demo Reseller",
      shopName: "Reseller Store",
      email: "reseller@demo.com",
      password: resellerPassword,
      contactNumber: "9999000002",
      status: "active",
      registrationStatus: "approved",
    },
  });
  console.log(`  Created: ${reseller.name} (reseller/reseller)\n`);

  // Create Retailer
  console.log("Creating demo Retailer...");
  const retailer = await prisma.retailer.create({
    data: {
      username: "retailer",
      name: "Demo Retailer",
      email: "retailer@demo.com",
      password: retailerPassword,
      contactNumber: "9999000003",
      status: "active",
      registrationStatus: "approved",
    },
  });
  console.log(`  Created: ${retailer.name} (retailer/retailer)\n`);

  console.log("=".repeat(50));
  console.log("Demo users created successfully!\n");
  console.log("Credentials:");
  console.log("  Wholesaler: wholesale / wholesale");
  console.log("  Reseller:   reseller / reseller");
  console.log("  Retailer:   retailer / retailer");
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
