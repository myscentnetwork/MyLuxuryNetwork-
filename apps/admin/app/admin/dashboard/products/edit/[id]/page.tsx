"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  sku: string;
  description: string;
  images: string[];
  video: string;
  sizes: string[];
  tags: string[];
  colours: string[];
  isRecommended: boolean;
  isHotSelling: boolean;
  isFeatured: boolean;
  status: "in_stock" | "out_of_stock";
  createdAt: string;
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

export default function EditProduct() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { categories: allCategories } = useCategories();
  const { brands: allBrands } = useBrands();
  const { sizes: allSizes } = useSizes();
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const router = useRouter();
  const params = useParams();

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
    status: "in_stock" as "in_stock" | "out_of_stock",
  });

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string>("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch product");

        const product = await response.json();
        setForm({
          categoryId: product.categoryId || "",
          brandId: product.brandId || "",
          name: product.name || "",
          sku: product.sku || "",
          description: product.description || "",
          isRecommended: product.isBestSeller || false,
          isHotSelling: product.isNewArrival || false,
          isFeatured: product.isFeatured || false,
          status: product.status || "in_stock",
        });
        setImages(product.images || []);
        setVideo(product.video || "");
        setSizes(product.sizeIds || []);
        setTags(product.tags || []);
        setColours(product.colours || []);
      } catch (error) {
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

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

      // Filter sizes by category
      const selectedCategory = categories.find((c) => c.id === form.categoryId);
      if (selectedCategory?.sizeIds && selectedCategory.sizeIds.length > 0) {
        const sizesForCategory = activeSizes.filter((size) =>
          selectedCategory.sizeIds!.includes(size.id)
        );
        setAvailableSizes(sortSizes(sizesForCategory));

        // Clear any selected sizes that are not valid for this category
        setSizes((prevSizes) =>
          prevSizes.filter((sizeId) => selectedCategory.sizeIds!.includes(sizeId))
        );
      } else {
        // If no sizes assigned to category, show all sizes
        setAvailableSizes(sortSizes(activeSizes));
      }
    } else {
      setFilteredBrands([]);
      setAvailableSizes([]);
      setSizes([]);
    }
  }, [form.categoryId, activeBrands, activeSizes, categories]);

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
      const updatedProduct = {
        categoryId: form.categoryId,
        brandId: form.brandId,
        name: form.name,
        sku: form.sku,
        description: form.description,
        images,
        video,
        sizeIds: sizes,
        tags,
        colours,
        isFeatured: form.isFeatured,
        isNewArrival: form.isHotSelling,
        isBestSeller: form.isRecommended,
        status: form.status,
      };

      console.log("Sending update:", JSON.stringify(updatedProduct, null, 2));
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update error:", errorData);
        throw new Error(errorData.error || "Failed to update product");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/dashboard/products");
      }, 1500);
    } catch (error) {
      alert("Failed to update product. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Product"
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
          Product updated successfully! Redirecting...
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
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                <span className="ml-2 text-xs text-gray-500 font-normal">Read-only</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  readOnly
                  className="w-full px-4 py-3 bg-luxury-gray/50 border border-gray-600 rounded-lg text-white focus:outline-none cursor-not-allowed"
                />
                {form.sku && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">SKU is auto-generated and cannot be changed</p>
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
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-square bg-white rounded-xl overflow-hidden">
                      <Image src={img} alt={`Product ${index + 1}`} fill className="object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Video */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Product Video (HD)
              </h3>
              {!video ? (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-luxury-gold transition-colors">
                  <input
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label htmlFor="video" className="cursor-pointer">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <p className="text-gray-400 mb-1">Click to upload HD video</p>
                    <p className="text-gray-500 text-sm">MP4, MOV, WEBM up to 100MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <video src={video} controls className="w-full max-h-64 rounded-lg" />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
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

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </h3>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full md:w-64 px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              >
                <option value="in_stock">IN STOCK</option>
                <option value="out_of_stock">OUT OF STOCK</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 pt-6 border-t border-luxury-gray flex gap-4">
            <button
              type="submit"
              disabled={submitting || !form.categoryId || !form.brandId || !form.name}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Changes"}
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
