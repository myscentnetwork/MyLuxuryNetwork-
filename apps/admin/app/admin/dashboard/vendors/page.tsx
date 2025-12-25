"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useVendors, useCategories } from "@/src/hooks/entities";
import { ConfirmModal, PageLoading, useToast } from "@/src/components/common";

interface FormErrors {
  name?: string;
  phone?: string;
  city?: string;
  general?: string;
}

export default function VendorList() {
  const { vendors, loading, fetchVendors, deleteVendor, toggleStatus } = useVendors();
  const { categories: allCategories, loading: categoriesLoading } = useCategories();
  const categories = allCategories.filter((c) => c.status === "active");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const toast = useToast();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    categoryIds: [] as string[],
    status: "active" as "active" | "inactive",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      city: "",
      categoryIds: [],
      status: "active",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^[\d\s\-+()]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Invalid phone format";
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          if (data.error?.includes("name")) {
            setErrors({ name: data.error });
          } else if (data.error?.includes("phone")) {
            setErrors({ phone: data.error });
          } else {
            setErrors({ general: data.error });
          }
        } else {
          setErrors({ general: data.error || "Failed to create vendor" });
        }
        setSubmitting(false);
        return;
      }

      toast.success("Vendor added successfully");
      resetForm();
      setShowForm(false);
      fetchVendors();
    } catch {
      setErrors({ general: "Failed to create vendor. Please try again." });
    }
    setSubmitting(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteVendor(deleteModal.id);
      toast.success("Vendor deleted successfully");
    } catch {
      toast.error("Failed to delete vendor");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id);
      toast.success("Status updated successfully");
    } catch {
      toast.error("Failed to update vendor status");
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const search = searchTerm.toLowerCase();
    const categoryNames = (vendor.categoryNames || []).join(" ").toLowerCase();
    return (
      vendor.name.toLowerCase().includes(search) ||
      (vendor.city || "").toLowerCase().includes(search) ||
      (vendor.phone || "").includes(search) ||
      categoryNames.includes(search)
    );
  });

  if (loading || categoriesLoading) {
    return (
      <AdminLayout title="Vendors">
        <PageLoading text="Loading vendors..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Vendors">
      <div className="space-y-6">
        {/* Add Vendor Form */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-luxury-gray/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Add New Vendor</h3>
                <p className="text-gray-500 text-sm">Click to {showForm ? "hide" : "show"} the form</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showForm ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showForm && (
            <div className="px-6 pb-6 border-t border-luxury-gray">
              <form onSubmit={handleSubmit} className="pt-6 space-y-4">
                {errors.general && (
                  <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vendor Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold ${
                        errors.name ? "border-red-500" : "border-gray-600"
                      }`}
                      placeholder="Enter vendor name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold ${
                        errors.phone ? "border-red-500" : "border-gray-600"
                      }`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold ${
                        errors.city ? "border-red-500" : "border-gray-600"
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                            formData.categoryIds.includes(category.id)
                              ? "bg-luxury-gold/20 border-luxury-gold text-white"
                              : "bg-luxury-gray border-gray-600 text-gray-400 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="sr-only"
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Add Vendor
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="text-gray-400 hover:text-white px-4 py-2.5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Search and View Toggle */}
        {vendors.length > 0 && (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, phone, city, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>
              {/* View Toggle */}
              <div className="flex gap-1 bg-luxury-gray rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-luxury-gold text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-luxury-gold text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vendor List */}
        {vendors.length === 0 ? (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Vendors Yet</h3>
            <p className="text-gray-400">Add your first vendor using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVendors.map((vendor) => {
                  const categoryNames = vendor.categoryNames || [];
                  return (
                    <div
                      key={vendor.id}
                      className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 hover:border-luxury-gold/50 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <button
                          onClick={() => handleToggleStatus(vendor.id)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            vendor.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {vendor.status}
                        </button>
                      </div>
                      {/* Content */}
                      <h3 className="text-white font-medium mb-2">{vendor.name}</h3>
                      <div className="space-y-1 text-sm mb-3">
                        <p className="text-gray-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {vendor.phone || "-"}
                        </p>
                        <p className="text-gray-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {vendor.city || "-"}
                        </p>
                      </div>
                      {/* Categories */}
                      {categoryNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {categoryNames.slice(0, 2).map((name) => (
                            <span key={name} className="px-2 py-1 bg-luxury-gold/20 text-luxury-gold text-xs rounded">
                              {name}
                            </span>
                          ))}
                          {categoryNames.length > 2 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                              +{categoryNames.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs mb-3">No categories</p>
                      )}
                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 pt-3 border-t border-luxury-gray">
                        <Link
                          href={`/admin/dashboard/vendors/edit/${vendor.id}`}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(vendor.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-luxury-gray">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Vendor Name</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Phone</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">City</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Categories</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendors.map((vendor) => (
                        <tr key={vendor.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{vendor.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-300">{vendor.phone || "-"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-400">{vendor.city || "-"}</p>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const categoryNames = vendor.categoryNames || [];
                              return categoryNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {categoryNames.slice(0, 2).map((name) => (
                                    <span key={name} className="px-2 py-1 bg-luxury-gold/20 text-luxury-gold text-xs rounded">
                                      {name}
                                    </span>
                                  ))}
                                  {categoryNames.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                                      +{categoryNames.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(vendor.id)}
                              className={`px-3 py-1 text-xs rounded-full ${
                                vendor.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {vendor.status}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/dashboard/vendors/edit/${vendor.id}`}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(vendor.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
              <p className="text-gray-500 text-sm">
                Showing {filteredVendors.length} of {vendors.length} vendors
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />
    </AdminLayout>
  );
}
