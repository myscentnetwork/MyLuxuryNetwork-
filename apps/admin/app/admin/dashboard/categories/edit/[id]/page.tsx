"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { sortSizes } from "@/src/utils/sorting";

interface Size {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export default function EditCategory() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();

  const [form, setForm] = useState({
    name: "",
    logo: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sizes
        const sizesRes = await fetch("/api/sizes");
        if (sizesRes.ok) {
          const sizesData = await sizesRes.json();
          const activeSizes = sizesData.filter((s: Size) => s.status === "active");
          setSizes(sortSizes(activeSizes));
        }

        // Fetch category
        const res = await fetch(`/api/categories/${params.id}`);
        if (!res.ok) throw new Error("Category not found");

        const category = await res.json();
        setForm({
          name: category.name,
          logo: category.logo || "",
          status: category.status,
        });
        if (category.logo) {
          setLogoPreview(category.logo);
        }
        if (category.sizeIds) {
          setSelectedSizes(category.sizeIds);
        }
      } catch (error) {
        router.push("/admin/dashboard/categories");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSizeToggle = (sizeId: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const selectAllSizes = () => {
    setSelectedSizes(sizes.map((s) => s.id));
  };

  const deselectAllSizes = () => {
    setSelectedSizes([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setForm((prev) => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setForm((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/categories/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logo: form.logo,
          status: form.status,
          sizeIds: selectedSizes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update category");

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/dashboard/categories");
      }, 1500);
    } catch (error) {
      alert("Failed to update category");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Category">
        <div className="text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Category"
      actions={
        <Link href="/admin/dashboard/categories" className="text-gray-400 hover:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </Link>
      }
    >
      {success ? (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-6 py-4 rounded-lg">
          Category updated successfully! Redirecting...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                placeholder="e.g., Luxury Watches"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo
              </label>
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain bg-white rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 bg-luxury-gray border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-luxury-gold transition-colors"
                >
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400">Click to upload logo</p>
                  <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 2MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sizes Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Available Sizes
                  {selectedSizes.length > 0 && (
                    <span className="ml-2 text-luxury-gold">({selectedSizes.length} selected)</span>
                  )}
                </label>
                {sizes.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllSizes}
                      className="text-xs text-luxury-gold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={deselectAllSizes}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
              {sizes.length === 0 ? (
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-500">
                    No sizes available.{" "}
                    <Link href="/admin/dashboard/sizes/new" className="text-luxury-gold hover:underline">
                      Add sizes first
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <label
                        key={size.id}
                        className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                          selectedSizes.includes(size.id)
                            ? "bg-luxury-gold text-black font-medium"
                            : "bg-luxury-dark border border-gray-600 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size.id)}
                          onChange={() => handleSizeToggle(size.id)}
                          className="sr-only"
                        />
                        {size.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Select sizes that will be available for products in this category
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/admin/dashboard/categories"
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
