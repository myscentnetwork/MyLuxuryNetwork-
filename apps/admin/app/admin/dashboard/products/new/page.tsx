"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { sortSizes } from "@/src/utils/sorting";

import { useCategories, useBrands, useSizes } from "@/src/hooks/entities";

// Lazy load RichTextEditor for better performance
const RichTextEditor = dynamic(() => import("@/src/components/forms/RichTextEditor"), {
  loading: () => <div className="h-64 bg-luxury-gray animate-pulse rounded-lg" />,
  ssr: false,
});

interface Category {
  id: string;
  name: string;
  status: "active" | "inactive";
  sizeIds?: string[];
}

interface Brand {
  id: string;
  name: string;
  status: "active" | "inactive";
  categoryIds?: string[];
}

interface Size {
  id: string;
  name: string;
  status: "active" | "inactive";
}

// Predefined options
const COLOUR_OPTIONS = [
  "Black", "White", "Grey", "Navy", "Brown", "Beige", "Cream",
  "Red", "Blue", "Green", "Yellow", "Orange", "Pink", "Purple",
  "Gold", "Silver", "Rose Gold", "Bronze", "Copper",
  "Burgundy", "Maroon", "Olive", "Teal", "Turquoise"
];

const TAG_OPTIONS = [
  "Luxury", "Premium", "New Arrival", "Best Seller", "Limited Edition",
  "Exclusive", "Trending", "Sale", "Classic", "Vintage",
  "Designer", "Handmade", "Eco-Friendly", "Unisex", "Gift",
  "Summer Collection", "Winter Collection", "Party Wear", "Casual", "Formal"
];

export default function AddProduct() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { categories: allCategories } = useCategories();
  const { brands: allBrands } = useBrands();
  const { sizes: allSizes } = useSizes();
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const router = useRouter();

  // Memoize filtered arrays to prevent infinite useEffect loops
  const categories = useMemo(
    () => allCategories.filter((c) => c.status === "active"),
    [allCategories]
  );
  const activeBrands = useMemo(
    () => allBrands.filter((b) => b.status === "active"),
    [allBrands]
  );
  const activeSizes = useMemo(
    () => sortSizes(allSizes.filter((s) => s.status === "active")),
    [allSizes]
  );

  const [form, setForm] = useState({
    categoryId: "",
    brandId: "",
    name: "",
    sku: "",
    description: "",
    isRecommended: false,
    isHotSelling: false,
    isFeatured: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);
  const [generatingSku, setGeneratingSku] = useState(false);

  // Image reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Filter brands and sizes when category changes
  useEffect(() => {
    if (form.categoryId) {
      // Filter brands by category
      const brandsForCategory = activeBrands.filter((brand) => {
        if (brand.categoryIds && brand.categoryIds.length > 0) {
          return brand.categoryIds.includes(form.categoryId);
        }
        return true;
      });
      setFilteredBrands(brandsForCategory);

      if (form.brandId && !brandsForCategory.some((b) => b.id === form.brandId)) {
        setForm((prev) => ({ ...prev, brandId: "" }));
      }

      // Filter sizes by category
      const selectedCategory = categories.find((c) => c.id === form.categoryId);
      if (selectedCategory?.sizeIds && selectedCategory.sizeIds.length > 0) {
        const sizesForCategory = activeSizes.filter((size) =>
          selectedCategory.sizeIds!.includes(size.id)
        );
        setAvailableSizes(sortSizes(sizesForCategory));
      } else {
        // If no sizes assigned to category, show all sizes
        setAvailableSizes(sortSizes(activeSizes));
      }

      // Clear selected sizes that are not in the new category
      if (selectedCategory?.sizeIds && selectedCategory.sizeIds.length > 0) {
        setSizes((prevSizes) =>
          prevSizes.filter((sizeId) => selectedCategory.sizeIds!.includes(sizeId))
        );
      }
    } else {
      setFilteredBrands([]);
      setAvailableSizes([]);
    }
  }, [form.categoryId, activeBrands, activeSizes, categories, form.brandId]);

  // Auto-generate SKU when category and brand are selected
  useEffect(() => {
    const generateSku = async () => {
      if (form.categoryId && form.brandId) {
        setGeneratingSku(true);
        try {
          const response = await fetch("/api/products/generate-sku", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: form.categoryId,
              brandId: form.brandId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setForm((prev) => ({ ...prev, sku: data.sku }));
          }
        } catch (error) {
          console.error("Failed to generate SKU:", error);
        } finally {
          setGeneratingSku(false);
        }
      } else {
        setForm((prev) => ({ ...prev, sku: "" }));
      }
    };

    generateSku();
  }, [form.categoryId, form.brandId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      if (name === "categoryId") {
        setForm((prev) => ({ ...prev, [name]: value, brandId: "" }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  // Toggle handlers for checkboxes
  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColour = (colour: string) => {
    setColours((prev) =>
      prev.includes(colour) ? prev.filter((c) => c !== colour) : [...prev, colour]
    );
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Image reordering functions
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newImages = [...images];
    const movedImage = newImages[fromIndex];
    if (movedImage) {
      newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      setImages(newImages);
    }
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  const moveLeft = (index: number) => {
    if (index > 0) moveImage(index, index - 1);
  };

  const moveRight = (index: number) => {
    if (index < images.length - 1) moveImage(index, index + 1);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      moveImage(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // Video upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = () => {
    setVideo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newProduct = {
        categoryId: form.categoryId,
        brandId: form.brandId,
        name: form.name,
        sku: form.sku,
        description: form.description,
        images,
        video,
        videoUrl: videoUrl.trim() || null,
        sizeIds: sizes,
        tags,
        colours,
        isRecommended: form.isRecommended,
        isHotSelling: form.isHotSelling,
        isFeatured: form.isFeatured,
        // status defaults to "out_of_stock" - will be updated via purchase bills when inventory is added
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/dashboard/products");
      }, 1500);
    } catch (error) {
      alert("Failed to create product. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Add Product"
      actions={
        <Link href="/admin/dashboard/products" className="text-gray-400 hover:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </Link>
      }
    >
      {success ? (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-6 py-4 rounded-lg">
          Product added successfully! Redirecting...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 max-w-4xl">
          <div className="space-y-8">
            {/* Category & Brand Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category & Brand
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  >
                    <option value="">Select category first</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-yellow-500 text-sm mt-1">
                      No categories available.{" "}
                      <Link href="/admin/dashboard/categories/new" className="underline">
                        Add one first
                      </Link>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="brandId" className="block text-sm font-medium text-gray-300 mb-2">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="brandId"
                    name="brandId"
                    value={form.brandId}
                    onChange={handleChange}
                    required
                    disabled={!form.categoryId}
                    className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.categoryId ? "Select category first" : "Select brand"}
                    </option>
                    {filteredBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {form.categoryId && filteredBrands.length === 0 && (
                    <p className="text-yellow-500 text-sm mt-1">
                      No brands available for this category.{" "}
                      <Link href="/admin/dashboard/brands/new" className="underline">
                        Add one first
                      </Link>
                    </p>
                  )}
                  {form.categoryId && filteredBrands.length > 0 && (
                    <p className="text-gray-500 text-sm mt-1">
                      {filteredBrands.length} brand{filteredBrands.length !== 1 ? "s" : ""} available for this category
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU (Stock Keeping Unit)
                <span className="ml-2 text-xs text-luxury-gold font-normal">Auto-generated</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  readOnly
                  placeholder={generatingSku ? "Generating..." : "Select category and brand first"}
                  className="w-full px-4 py-3 bg-luxury-gray/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none cursor-not-allowed"
                />
                {generatingSku && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-luxury-gold"></div>
                  </div>
                )}
                {form.sku && !generatingSku && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Format: BRAND-SERIAL (e.g., RASASI-01, LATTAFA-02)
              </p>
            </div>

            {/* Product Images */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Product Images (HD)
              </h3>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-luxury-gold transition-colors">
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-400 mb-1">Click to upload HD images</p>
                  <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 10MB each</p>
                </label>
              </div>
              {images.length > 0 && (
                <>
                  <p className="text-gray-500 text-xs mt-4 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Drag to reorder • First image is primary • Use arrows to move
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {images.map((img, index) => {
                      const isPrimary = index === 0;
                      const isDragging = draggedIndex === index;
                      const isDragOver = dragOverIndex === index;

                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`relative group aspect-square cursor-grab active:cursor-grabbing transition-all duration-200 ${
                            isDragging ? "opacity-50 scale-95" : ""
                          } ${isDragOver ? "ring-2 ring-luxury-gold ring-offset-2 ring-offset-luxury-dark" : ""}`}
                        >
                          {/* Primary Badge */}
                          {isPrimary && (
                            <div className="absolute -top-2 -left-2 z-20 bg-luxury-gold text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                              PRIMARY
                            </div>
                          )}

                          {/* Image */}
                          <div className={`w-full h-full bg-white rounded-xl overflow-hidden border-2 ${isPrimary ? "border-luxury-gold" : "border-transparent"}`}>
                            <Image src={img} alt={`Product ${index + 1}`} fill className="object-contain" />
                          </div>

                          {/* Position indicator */}
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                            {index + 1}
                          </div>

                          {/* Hover Controls */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2">
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>

                            {/* Move buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moveLeft(index)}
                                disabled={index === 0}
                                className={`p-1.5 rounded-full transition-colors ${
                                  index === 0 ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-white/20 hover:bg-white/40 text-white"
                                }`}
                                title="Move left"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRight(index)}
                                disabled={index === images.length - 1}
                                className={`p-1.5 rounded-full transition-colors ${
                                  index === images.length - 1 ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-white/20 hover:bg-white/40 text-white"
                                }`}
                                title="Move right"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>

                            {/* Set as primary */}
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => setAsPrimary(index)}
                                className="px-2 py-1 bg-luxury-gold hover:bg-yellow-500 text-black text-xs font-semibold rounded-full transition-colors flex items-center gap-1"
                                title="Set as primary image"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Primary
                              </button>
                            )}
                          </div>

                          {/* Drag handle */}
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 bg-black/50 rounded">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Product Video */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Product Video
              </h3>

              {/* Video Source Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Option 1: Upload Video */}
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Video File
                  </h4>
                  {!video ? (
                    <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="video"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={!!videoUrl}
                      />
                      <label htmlFor="video" className={`${videoUrl ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                        <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        <p className="text-gray-400 text-sm">Click to upload</p>
                        <p className="text-gray-500 text-xs">MP4, MOV, WEBM up to 100MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <video src={video} controls className="w-full h-40 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                        Uploaded
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: YouTube/Video URL */}
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube / Video URL
                    <span className="text-xs text-gray-500 font-normal">(Alternative)</span>
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={!!video}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    />
                    <p className="text-gray-500 text-xs">
                      Supports: YouTube, Vimeo, or direct video URLs
                    </p>
                    {/* YouTube Preview */}
                    {videoUrl && !video && (
                      <div className="relative">
                        {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                          <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${
                                videoUrl.includes("youtu.be")
                                  ? videoUrl.split("youtu.be/")[1]?.split("?")[0]
                                  : videoUrl.includes("/shorts/")
                                  ? videoUrl.split("/shorts/")[1]?.split("?")[0]
                                  : videoUrl.split("v=")[1]?.split("&")[0]
                              }`}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          </div>
                        ) : videoUrl.includes("vimeo.com") ? (
                          <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                              src={`https://player.vimeo.com/video/${videoUrl.split("vimeo.com/")[1]?.split("?")[0]}`}
                              className="w-full h-full"
                              allowFullScreen
                              allow="autoplay; fullscreen; picture-in-picture"
                            />
                          </div>
                        ) : (
                          <video src={videoUrl} controls className="w-full h-40 rounded-lg object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setVideoUrl("")}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <p className="mt-3 text-gray-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Upload a video file OR paste a YouTube/Vimeo URL. If both are provided, uploaded video takes priority.
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Description
              </h3>
              <RichTextEditor
                value={form.description}
                onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                placeholder="Enter detailed product description..."
              />
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Sizes
                {sizes.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({sizes.length} selected)</span>
                )}
              </h3>
              <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                {availableSizes.length === 0 ? (
                  <p className="text-gray-500">
                    No sizes available.{" "}
                    <Link href="/admin/dashboard/sizes/new" className="text-luxury-gold hover:underline">
                      Add sizes first
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <label
                        key={size.id}
                        className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                          sizes.includes(size.id)
                            ? "bg-luxury-gold text-black font-medium"
                            : "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sizes.includes(size.id)}
                          onChange={() => toggleSize(size.id)}
                          className="sr-only"
                        />
                        {size.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colours */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Colours
                {colours.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({colours.length} selected)</span>
                )}
              </h3>
              <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {COLOUR_OPTIONS.map((colour) => (
                    <label
                      key={colour}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        colours.includes(colour)
                          ? "bg-purple-500 text-white font-medium"
                          : "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={colours.includes(colour)}
                        onChange={() => toggleColour(colour)}
                        className="sr-only"
                      />
                      {colour}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
                {tags.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({tags.length} selected)</span>
                )}
              </h3>
              <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <label
                      key={tag}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        tags.includes(tag)
                          ? "bg-blue-500 text-white font-medium"
                          : "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={tags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="sr-only"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Flags */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Product Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recommended */}
                <label className="flex items-center gap-3 p-4 bg-luxury-gray border border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors">
                  <input
                    type="checkbox"
                    name="isRecommended"
                    checked={form.isRecommended}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-white font-medium">Recommended</p>
                    <p className="text-gray-500 text-sm">Show in recommendations</p>
                  </div>
                </label>

                {/* Hot Selling */}
                <label className="flex items-center gap-3 p-4 bg-luxury-gray border border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors">
                  <input
                    type="checkbox"
                    name="isHotSelling"
                    checked={form.isHotSelling}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-white font-medium">Hot Selling</p>
                    <p className="text-gray-500 text-sm">Mark as hot selling item</p>
                  </div>
                </label>

                {/* Featured */}
                <label className="flex items-center gap-3 p-4 bg-luxury-gray border border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-white font-medium">Featured Product</p>
                    <p className="text-gray-500 text-sm">Display on homepage</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 pt-6 border-t border-luxury-gray flex gap-4">
            <button
              type="submit"
              disabled={submitting || !form.categoryId || !form.brandId || !form.name}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding Product..." : "Add Product"}
            </button>
            <Link
              href="/admin/dashboard/products"
              className="bg-luxury-gray hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
