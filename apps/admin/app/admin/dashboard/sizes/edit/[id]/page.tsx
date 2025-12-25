"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";

export default function EditSize() {
  const router = useRouter();
  const params = useParams();
  const sizeId = params.id as string;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSize = async () => {
      try {
        const res = await fetch(`/api/sizes/${sizeId}`);
        if (!res.ok) throw new Error("Size not found");
        const size = await res.json();
        setName(size.name);
      } catch (error) {
        router.push("/admin/dashboard/sizes");
      } finally {
        setLoading(false);
      }
    };
    fetchSize();
  }, [sizeId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a size name");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/sizes/${sizeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update size");

      router.push("/admin/dashboard/sizes");
    } catch (error) {
      alert("Failed to update size");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Size">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Size"
      actions={
        <Link
          href="/admin/dashboard/sizes"
          className="bg-luxury-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sizes
        </Link>
      }
    >
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Size Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter size (e.g., XL, 42, Large)"
                className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Examples: XS, S, M, L, XL, XXL, 28, 30, 32, One Size, etc.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update Size"}
              </button>
              <Link
                href="/admin/dashboard/sizes"
                className="px-6 py-3 bg-luxury-gray hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
