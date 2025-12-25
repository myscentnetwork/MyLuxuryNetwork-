"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useCategories, useSizes } from "@/src/hooks/entities";
import { sortSizeNames } from "@/src/utils/sorting";
import { ConfirmModal, PageLoading, useToast } from "@/src/components/common";

// Expandable size tags component
function SizeTags({ sizeNames }: { sizeNames: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_VISIBLE = 4;

  if (sizeNames.length === 0) {
    return <span className="text-gray-500 text-sm">No sizes</span>;
  }

  const visibleSizes = expanded ? sizeNames : sizeNames.slice(0, MAX_VISIBLE);
  const hiddenCount = sizeNames.length - MAX_VISIBLE;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleSizes.map((name) => (
        <span
          key={name}
          className="px-2 py-1 bg-luxury-gold/20 text-luxury-gold text-xs rounded"
        >
          {name}
        </span>
      ))}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors cursor-pointer"
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && sizeNames.length > MAX_VISIBLE && (
        <button
          onClick={() => setExpanded(false)}
          className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded hover:bg-gray-500/30 transition-colors cursor-pointer"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export default function CategoryList() {
  const { categories, loading, deleteCategory, toggleStatus } = useCategories();
  const { sizes } = useSizes();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const toast = useToast();

  const getSizeNames = (sizeIds: string[] = []) => {
    const names = sizeIds
      .map((id) => sizes.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];
    return sortSizeNames(names);
  };

  const filteredCategories = categories.filter((category) => {
    const search = searchTerm.toLowerCase();
    const sizeNames = getSizeNames(category.sizeIds).join(" ").toLowerCase();
    return (
      category.name.toLowerCase().includes(search) ||
      sizeNames.includes(search)
    );
  });

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteCategory(deleteModal.id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Categories">
        <PageLoading text="Loading categories..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Categories"
      actions={
        <Link
          href="/admin/dashboard/categories/new"
          className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </Link>
      }
    >
      {categories.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Categories Yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first category.</p>
          <Link
            href="/admin/dashboard/categories/new"
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and View Toggle */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by category name or sizes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
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

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors"
                >
                  {/* Category Logo */}
                  <div className="aspect-square bg-luxury-gray flex items-center justify-center relative">
                    {category.logo ? (
                      <Image src={category.logo} alt={category.name} fill className="object-cover" />
                    ) : (
                      <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    )}
                  </div>
                  {/* Category Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">{category.name}</h3>
                      <button
                        onClick={() => handleToggleStatus(category.id)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          category.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {category.status}
                      </button>
                    </div>
                    {/* Sizes */}
                    <SizeTags sizeNames={getSizeNames(category.sizeIds)} />
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-luxury-gray">
                      <Link
                        href={`/admin/dashboard/categories/edit/${category.id}`}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-luxury-gray">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Sizes</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-luxury-gray relative">
                              {category.logo ? (
                                <Image src={category.logo} alt={category.name} fill className="object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-white font-medium">{category.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <SizeTags sizeNames={getSizeNames(category.sizeIds)} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(category.id)}
                            className={`px-3 py-1 text-sm rounded-full ${
                              category.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {category.status}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/dashboard/categories/edit/${category.id}`} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors" title="Edit">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(category.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Summary Footer */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredCategories.length} of {categories.length} categories
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />
    </AdminLayout>
  );
}
