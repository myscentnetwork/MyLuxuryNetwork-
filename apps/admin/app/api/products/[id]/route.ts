import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";
import { syncNewProduct, syncRemovedProduct } from "@/lib/autoImportSync";

// GET /api/products/[id] - Get a single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        sizes: { include: { size: true } },
        images: { orderBy: { order: "asc" } },
        tags: true,
        colours: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("PUT /api/products/[id] received:", JSON.stringify(body, null, 2));
    const {
      name,
      sku,
      description,
      video,
      videoUrl: externalVideoUrl, // YouTube/Vimeo/external video URL
      categoryId,
      brandId,
      sizeIds,
      images,
      tags,
      colours,
      isFeatured,
      isNewArrival,
      isBestSeller,
      status,
    } = body;

    // Upload new images to Cloudinary (or store base64 directly if Cloudinary not configured)
    let uploadedImages: string[] | undefined;
    if (images) {
      uploadedImages = [];
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
    }

    // Upload video if new (or store base64 directly)
    let uploadedVideoUrl = video || null;
    if (video && video.startsWith("data:")) {
      const result = await uploadVideo(video, "myluxury/products/videos");
      uploadedVideoUrl = result?.url || video; // Fallback to base64 if Cloudinary not configured
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        video: uploadedVideoUrl,
        videoUrl: externalVideoUrl !== undefined ? (externalVideoUrl || null) : undefined, // Store external video URL (YouTube/Vimeo)
        isFeatured,
        isNewArrival,
        isBestSeller,
        status,
        categoryId,
        brandId,
        sizes: sizeIds ? {
          deleteMany: {},
          create: sizeIds.map((sizeId: string) => ({ sizeId })),
        } : undefined,
        images: uploadedImages ? {
          deleteMany: {},
          create: uploadedImages.map((url, index) => ({
            url,
            order: index,
          })),
        } : undefined,
        tags: tags ? {
          deleteMany: {},
          create: tags.map((name: string) => ({ name })),
        } : undefined,
        colours: colours ? {
          deleteMany: {},
          create: colours.map((name: string) => ({ name })),
        } : undefined,
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
    });
  } catch (error) {
    console.error("Error updating product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 });
  }
}

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
    return costPrice + (costPrice * markupValue / 100);
  } else {
    return costPrice + markupValue;
  }
}

// PATCH /api/products/[id] - Partial update (for inline editing)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow specific fields to be updated via PATCH
    // Note: costPrice is NOT editable - it comes from purchase bills only
    const allowedFields = [
      "mrp",
      "wholesalePrice",
      "resellerPrice",
      "retailPrice",
      "stockQuantity",
      "name",
      "sku",
      "status",
    ];

    const updateData: Record<string, number | string> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // If costPrice is being updated, check if we should auto-apply markups
    if (updateData.costPrice !== undefined) {
      const costPrice = updateData.costPrice as number;

      // Get current product to check if prices are already set
      const currentProduct = await prisma.product.findUnique({
        where: { id },
        select: { wholesalePrice: true, resellerPrice: true, retailPrice: true },
      });

      // Get auto-markup settings
      const markupSettings = await getAutoMarkupSettings();

      if (markupSettings && currentProduct) {
        // Auto-apply wholesale price if not already set and not being manually updated
        if ((currentProduct.wholesalePrice || 0) === 0 &&
            updateData.wholesalePrice === undefined &&
            markupSettings.wholesaleMarkupValue > 0) {
          updateData.wholesalePrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.wholesaleMarkupType,
            markupSettings.wholesaleMarkupValue
          );
        }

        // Auto-apply reseller price if not already set and not being manually updated
        if ((currentProduct.resellerPrice || 0) === 0 &&
            updateData.resellerPrice === undefined &&
            markupSettings.resellerMarkupValue > 0) {
          updateData.resellerPrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.resellerMarkupType,
            markupSettings.resellerMarkupValue
          );
        }

        // Auto-apply retail price if not already set and not being manually updated
        if ((currentProduct.retailPrice || 0) === 0 &&
            updateData.retailPrice === undefined &&
            markupSettings.retailMarkupValue > 0) {
          updateData.retailPrice = calculatePriceWithMarkup(
            costPrice,
            markupSettings.retailMarkupType,
            markupSettings.retailMarkupValue
          );
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
      },
    });

    // Sync to auto-import users if status changed to in_stock or prices updated
    const priceFieldsUpdated = updateData.wholesalePrice !== undefined ||
                               updateData.resellerPrice !== undefined ||
                               updateData.retailPrice !== undefined;

    if (updateData.status === "in_stock" || priceFieldsUpdated) {
      syncNewProduct({
        id: product.id,
        wholesalePrice: product.wholesalePrice,
        resellerPrice: product.resellerPrice,
        retailPrice: product.retailPrice,
      }).catch(console.error);
    }

    return NextResponse.json({
      ...product,
      categoryName: product.category.name,
      brandName: product.brand.name,
    });
  } catch (error) {
    console.error("Error patching product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Remove product from all auto-imported stores first
    await syncRemovedProduct(id);

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
