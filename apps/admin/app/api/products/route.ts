import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";
import { syncNewProduct } from "@/lib/autoImportSync";

// GET /api/products - List all products (optionally filter by categoryId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        brand: true,
        sizes: { include: { size: true } },
        images: { orderBy: { order: "asc" } },
        tags: true,
        colours: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = products.map((p: typeof products[number]) => ({
      ...p,
      sizeIds: p.sizes.map((s: { sizeId: string }) => s.sizeId),
      sizes: p.sizes.map((s: { size: { id: string; name: string } }) => ({
        id: s.size.id,
        name: s.size.name,
      })),
      images: p.images.map((i: { url: string }) => i.url),
      tags: p.tags.map((t: { name: string }) => t.name),
      colours: p.colours.map((c: { name: string }) => c.name),
      categoryName: p.category.name,
      brandName: p.brand.name,
    }));

    return NextResponse.json(transformed);
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
    } = body;

    if (!sku || !categoryId || !brandId) {
      return NextResponse.json(
        { error: "SKU, category, and brand are required" },
        { status: 400 }
      );
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
