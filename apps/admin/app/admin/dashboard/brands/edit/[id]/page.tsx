"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useCategories } from "@/src/hooks/entities";

export default function EditBrand() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { categories } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();

  const [form, setForm] = useState({
    name: "",
    logo: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch(`/api/brands/${params.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch brand");
        }
        const brand = await res.json();

        setForm({
          name: brand.name,
          logo: brand.logo || "",
          status: brand.status,
        });
        if (brand.logo) {
          setLogoPreview(brand.logo);
        }
        if (brand.categoryIds) {
          setSelectedCategories(brand.categoryIds);
        }
        setLoading(false);
      } catch (error) {
        alert("Failed to load brand");
        router.push("/admin/dashboard/brands");
      }
    };

    fetchBrand();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllCategories = () => {
    const activeCategories = categories.filter((c) => c.status === "active");
    setSelectedCategories(activeCategories.map((c) => c.id));
  };

  const deselectAllCategories = () => {
    setSelectedCategories([]);
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

    const updatedBrand = {
      name: form.name,
      logo: form.logo || null,
      status: form.status,
      categoryIds: selectedCategories,
      slug: form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    };

    try {
      const res = await fetch(`/api/brands/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBrand),
      });

      if (!res.ok) {
        throw new Error("Failed to update brand");
      }

      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/dashboard/brands");
      }, 1500);
    } catch (error) {
      alert("Failed to update brand. Please try again.");
      setSubmitting(false);
    }
  };

  const activeCategories = categories.filter((c) => c.status === "active");

  if (loading) {
    return (
      <AdminLayout title="Edit Brand">
        <div className="text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Brand"
      actions={
        <Link href="/admin/dashboard/brands" className="text-gray-400 hover:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </Link>
      }
    >
      {success ? (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-6 py-4 rounded-lg">
          Brand updated successfully! Redirecting...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                placeholder="e.g., Rasasi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Logo
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-gray-300 hover:border-luxury-gold hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain bg-white rounded-lg border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {!logoPreview && (
                  <span className="text-gray-500 text-sm">PNG, JPG up to 2MB</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Categories Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Categories <span className="text-gray-500">(Select categories this brand deals in)</span>
                </label>
                {activeCategories.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className="text-xs text-luxury-gold hover:text-yellow-400"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={deselectAllCategories}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {activeCategories.length === 0 ? (
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">No categories available.</p>
                  <Link href="/admin/dashboard/categories/new" className="text-luxury-gold hover:text-yellow-400 text-sm underline">
                    Add categories first
                  </Link>
                </div>
              ) : (
                <div className="bg-luxury-gray border border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {activeCategories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCategories.includes(category.id)
                            ? "bg-luxury-gold/20 border border-luxury-gold"
                            : "bg-luxury-dark border border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-luxury-gray text-luxury-gold focus:ring-luxury-gold focus:ring-offset-0"
                        />
                        <span className={`text-sm ${selectedCategories.includes(category.id) ? "text-white" : "text-gray-300"}`}>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedCategories.length > 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
                </p>
              )}
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
              href="/admin/dashboard/brands"
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
