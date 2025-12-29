import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";
import { syncNewProduct } from "@/lib/autoImportSync";

// Helper function to get auto-markup settings
async function getAutoMarkupSettings() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: "auto_markup_settings" },
    });
    if (setting) {
      return JSON.parse(setting.value);
    }
  } catch (e) {
    console.error("Error fetching auto-markup settings:", e);
  }
  return null;
}

// Helper function to calculate price with markup
function calculatePriceWithMarkup(costPrice: number, markupType: string, markupValue: number): number {
  if (!costPrice || costPrice <= 0 || !markupValue || markupValue <= 0) return 0;
  if (markupType === "percentage") {
    return Math.round(costPrice + (costPrice * markupValue / 100));
  } else {
    return Math.round(costPrice + markupValue);
  }
}

// GET /api/products - List all products (optionally filter by categoryId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    // Optimized query - only select needed fields
    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        video: true,
        videoUrl: true,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true,
        status: true,
        stockQuantity: true,
        mrp: true,
        costPrice: true,
        wholesalePrice: true,
        resellerPrice: true,
        retailPrice: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        brandId: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        sizes: {
          select: {
            sizeId: true,
            size: { select: { id: true, name: true } }
          }
        },
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 5 // Limit images to first 5
        },
        tags: { select: { name: true } },
        colours: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = products.map((p) => ({
      ...p,
      sizeIds: p.sizes.map((s) => s.sizeId),
      sizes: p.sizes.map((s) => ({
        id: s.size.id,
        name: s.size.name,
      })),
      images: p.images.map((i) => i.url),
      tags: p.tags.map((t) => t.name),
      colours: p.colours.map((c) => c.name),
      categoryName: p.category.name,
      brandName: p.brand.name,
    }));

    // Add cache headers for faster navigation
    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      description,
      video,
      videoUrl: externalVideoUrl, // YouTube/Vimeo/external video URL
      categoryId,
      brandId,
      sizeIds = [],
      images = [],
      tags = [],
      colours = [],
      isFeatured = false,
      isNewArrival = false,
      isBestSeller = false,
      status = "out_of_stock", // Default to out_of_stock - will be updated via purchase bills
      costPrice = 0,
      mrp = 0,
      wholesalePrice: inputWholesalePrice,
      resellerPrice: inputResellerPrice,
      retailPrice: inputRetailPrice,
    } = body;

    if (!sku || !categoryId || !brandId) {
      return NextResponse.json(
        { error: "SKU, category, and brand are required" },
        { status: 400 }
      );
    }

    // Auto-calculate selling prices if costPrice is provided and prices are not set
    let wholesalePrice = inputWholesalePrice || 0;
    let resellerPrice = inputResellerPrice || 0;
    let retailPrice = inputRetailPrice || 0;

    if (costPrice > 0) {
      const markupSettings = await getAutoMarkupSettings();
      if (markupSettings) {
        // Auto-apply wholesale price if not provided
        if (!wholesalePrice && markupSettings.wholesaleMarkupValue > 0) {
          wholesalePrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.wholesaleMarkupType,
            markupSettings.wholesaleMarkupValue
          );
        }

        // Auto-apply reseller price if not provided
        if (!resellerPrice && markupSettings.resellerMarkupValue > 0) {
          resellerPrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.resellerMarkupType,
            markupSettings.resellerMarkupValue
          );
        }

        // Auto-apply retail price if not provided
        if (!retailPrice && markupSettings.retailMarkupValue > 0) {
          retailPrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.retailMarkupType,
            markupSettings.retailMarkupValue
          );
        }
      }
    }

    // Upload images to Cloudinary (or store base64 directly if Cloudinary not configured)
    const uploadedImages: string[] = [];
    for (const img of images) {
      if (img.startsWith("data:")) {
        const result = await uploadImage(img, "myluxury/products");
        if (result?.url) {
          uploadedImages.push(result.url);
        } else {
          // Cloudinary not configured - store base64 directly
          uploadedImages.push(img);
        }
      } else {
        uploadedImages.push(img);
      }
    }

    // Upload video to Cloudinary if provided (or store base64 directly)
    let uploadedVideoUrl: string | null = video || null;
    if (video && video.startsWith("data:")) {
      const result = await uploadVideo(video, "myluxury/products/videos");
      uploadedVideoUrl = result?.url || video; // Fallback to base64 if Cloudinary not configured
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        video: uploadedVideoUrl,
        videoUrl: externalVideoUrl || null, // Store external video URL (YouTube/Vimeo)
        isFeatured,
        isNewArrival,
        isBestSeller,
        status,
        costPrice,
        mrp,
        wholesalePrice,
        resellerPrice,
        retailPrice,
        categoryId,
        brandId,
        sizes: {
          create: sizeIds.map((sizeId: string) => ({ sizeId })),
        },
        images: {
          create: uploadedImages.map((url, index) => ({
            url,
            order: index,
          })),
        },
        tags: {
          create: tags.map((name: string) => ({ name })),
        },
        colours: {
          create: colours.map((name: string) => ({ name })),
        },
      },
      include: {
        category: true,
        brand: true,
        sizes: { include: { size: true } },
        images: { orderBy: { order: "asc" } },
        tags: true,
        colours: true,
      },
    });

    // Sync new product to all auto-import enabled users
    // Run in background to not block the response
    syncNewProduct({
      id: product.id,
      wholesalePrice: product.wholesalePrice,
      resellerPrice: product.resellerPrice,
      retailPrice: product.retailPrice,
    }).catch(console.error);

    return NextResponse.json({
      ...product,
      sizeIds: product.sizes.map((s: { sizeId: string }) => s.sizeId),
      sizes: product.sizes.map((s: { size: { id: string; name: string } }) => ({
        id: s.size.id,
        name: s.size.name,
      })),
      images: product.images.map((i: { url: string }) => i.url),
      tags: product.tags.map((t: { name: string }) => t.name),
      colours: product.colours.map((c: { name: string }) => c.name),
      categoryName: product.category.name,
      brandName: product.brand.name,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
