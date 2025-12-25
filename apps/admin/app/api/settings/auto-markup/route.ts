import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface AutoMarkupSettings {
  wholesaleMarkupType: "percentage" | "fixed";
  wholesaleMarkupValue: number;
  resellerMarkupType: "percentage" | "fixed";
  resellerMarkupValue: number;
  retailMarkupType: "percentage" | "fixed";
  retailMarkupValue: number;
}

const DEFAULT_SETTINGS: AutoMarkupSettings = {
  wholesaleMarkupType: "percentage",
  wholesaleMarkupValue: 0,
  resellerMarkupType: "percentage",
  resellerMarkupValue: 0,
  retailMarkupType: "percentage",
  retailMarkupValue: 0,
};

const SETTINGS_KEY = "auto_markup_settings";

// GET - Fetch current auto-markup settings
export async function GET() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (setting) {
      const settings = JSON.parse(setting.value) as AutoMarkupSettings;
      return NextResponse.json({ settings });
    }

    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  } catch (error) {
    console.error("Error fetching auto-markup settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Helper function to calculate price with markup
function calculatePrice(costPrice: number, markupType: string, markupValue: number): number {
  if (!costPrice || costPrice <= 0 || !markupValue || markupValue <= 0) return 0;
  if (markupType === "percentage") {
    return Math.round(costPrice + (costPrice * markupValue / 100));
  }
  return Math.round(costPrice + markupValue);
}

// POST - Save auto-markup settings
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const settings: AutoMarkupSettings = {
      wholesaleMarkupType: body.wholesaleMarkupType || "percentage",
      wholesaleMarkupValue: parseFloat(body.wholesaleMarkupValue) || 0,
      resellerMarkupType: body.resellerMarkupType || "percentage",
      resellerMarkupValue: parseFloat(body.resellerMarkupValue) || 0,
      retailMarkupType: body.retailMarkupType || "percentage",
      retailMarkupValue: parseFloat(body.retailMarkupValue) || 0,
    };

    await prisma.appSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: JSON.stringify(settings),
      },
      update: {
        value: JSON.stringify(settings),
      },
    });

    // If applyToExisting is true, apply markups to all products with cost price set
    if (body.applyToExisting) {
      const overrideAll = body.overrideExisting === true;

      const products = await prisma.product.findMany({
        where: {
          costPrice: { gt: 0 },
        },
        select: {
          id: true,
          costPrice: true,
          wholesalePrice: true,
          resellerPrice: true,
          retailPrice: true,
        },
      });

      let updatedCount = 0;

      for (const product of products) {
        const updateData: Record<string, number> = {};

        // Update wholesale price if overrideAll or currently 0
        if ((overrideAll || (product.wholesalePrice || 0) === 0) && settings.wholesaleMarkupValue > 0) {
          updateData.wholesalePrice = calculatePrice(
            product.costPrice,
            settings.wholesaleMarkupType,
            settings.wholesaleMarkupValue
          );
        }

        // Update reseller price if overrideAll or currently 0
        if ((overrideAll || (product.resellerPrice || 0) === 0) && settings.resellerMarkupValue > 0) {
          updateData.resellerPrice = calculatePrice(
            product.costPrice,
            settings.resellerMarkupType,
            settings.resellerMarkupValue
          );
        }

        // Update retail price if overrideAll or currently 0
        if ((overrideAll || (product.retailPrice || 0) === 0) && settings.retailMarkupValue > 0) {
          updateData.retailPrice = calculatePrice(
            product.costPrice,
            settings.retailMarkupType,
            settings.retailMarkupValue
          );
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data: updateData,
          });
          updatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Settings saved and applied to ${updatedCount} products`,
        settings,
        updatedCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Auto-markup settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Error saving auto-markup settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
