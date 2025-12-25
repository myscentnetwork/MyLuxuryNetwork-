"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useResellers, Reseller } from "@/src/hooks/entities";

// Helper function to get social media URL
const getSocialUrl = (platform: string, handle: string): string => {
  const cleanHandle = handle.replace(/^@/, "");
  switch (platform.toLowerCase()) {
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "facebook":
      return `https://facebook.com/${cleanHandle}`;
    case "youtube":
      return `https://youtube.com/@${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    case "twitter/x":
    case "twitter":
    case "x":
      return `https://x.com/${cleanHandle}`;
    case "linkedin":
      return `https://linkedin.com/in/${cleanHandle}`;
    case "pinterest":
      return `https://pinterest.com/${cleanHandle}`;
    case "snapchat":
      return `https://snapchat.com/add/${cleanHandle}`;
    case "telegram":
      return `https://t.me/${cleanHandle}`;
    case "discord":
      return `https://discord.gg/${cleanHandle}`;
    case "threads":
      return `https://threads.net/@${cleanHandle}`;
    case "website":
      return handle.startsWith("http") ? handle : `https://${handle}`;
    default:
      return "#";
  }
};

// Helper function to format WhatsApp URL
const getWhatsAppUrl = (number: string): string => {
  const cleanNumber = number.replace(/[\s\-\(\)\+]/g, "");
  return `https://wa.me/${cleanNumber}`;
};

function ResellerListContent() {
  const { resellers, loading, deleteReseller, approveReseller, rejectReseller } = useResellers();
  const searchParams = useSearchParams();
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Read status filter from URL query params
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "pending" || status === "approved" || status === "rejected") {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStoreUrl = (shopName: string | null) => {
    return `https://myluxury.network/${(shopName || "").toLowerCase().replace(/\s+/g, "")}`;
  };

  const handleViewProfile = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setShowProfileModal(true);
  };

  const closeModal = () => {
    setShowProfileModal(false);
    setSelectedReseller(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reseller?")) {
      try {
        await deleteReseller(id);
      } catch (error) {
        alert("Failed to delete reseller. Please try again.");
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm("Approve this reseller? They will be able to login after approval.")) {
      try {
        setProcessingId(id);
        await approveReseller(id);
      } catch (error) {
        alert("Failed to approve reseller. Please try again.");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Reject this reseller? They will not be able to login.")) {
      try {
        setProcessingId(id);
        await rejectReseller(id);
      } catch (error) {
        alert("Failed to reject reseller. Please try again.");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) + " at " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Count pending resellers
  const pendingCount = resellers.filter((r) => r.registrationStatus === "pending").length;

  const filteredResellers = resellers.filter((reseller) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      reseller.name.toLowerCase().includes(search) ||
      reseller.shopName?.toLowerCase().includes(search) ||
      reseller.email?.toLowerCase().includes(search) ||
      reseller.contactNumber?.includes(search)
    );

    // Filter by registration status
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && reseller.registrationStatus === statusFilter;
  });

  return (
    <AdminLayout
      title="Reseller List"
      actions={
        <Link
          href="/admin/dashboard/resellers/new"
          className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Reseller
        </Link>
      }
    >
      {/* Pending Approvals Alert */}
      {!loading && pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-yellow-500 font-medium">
                  {pendingCount} Pending Approval{pendingCount > 1 ? "s" : ""}
                </h3>
                <p className="text-yellow-400/70 text-sm">
                  New reseller registration{pendingCount > 1 ? "s" : ""} waiting for your review
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("pending")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
          </div>
        </div>
      ) : resellers.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Resellers Yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first reseller.</p>
          <Link
            href="/admin/dashboard/resellers/new"
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Reseller
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
                  placeholder="Search by name, shop, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                />
              </div>
              {/* Status Filter */}
              <div className="flex gap-1 bg-luxury-gray rounded-lg p-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    statusFilter === "all"
                      ? "bg-luxury-gold text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    statusFilter === "pending"
                      ? "bg-yellow-500 text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Pending
                  {pendingCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      statusFilter === "pending" ? "bg-black/20 text-black" : "bg-yellow-500 text-black"
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    statusFilter === "approved"
                      ? "bg-green-500 text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    statusFilter === "rejected"
                      ? "bg-red-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Rejected
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResellers.map((reseller) => (
                <div
                  key={reseller.id}
                  className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors p-4"
                >
                  {/* Reseller Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-luxury-gold">
                        {reseller.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{reseller.name}</h3>
                      <p className="text-luxury-gold text-sm truncate">{reseller.shopName}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        reseller.registrationStatus === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : reseller.registrationStatus === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {reseller.registrationStatus}
                    </span>
                  </div>
                  {/* Contact Info */}
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{reseller.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {reseller.contactNumber}
                    </div>
                  </div>
                  {/* Social Links */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {reseller.instagramHandle && (
                      <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">IG</span>
                    )}
                    {reseller.facebookHandle && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">FB</span>
                    )}
                    {reseller.youtubeHandle && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">YT</span>
                    )}
                    {reseller.telegramHandle && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">TG</span>
                    )}
                    {reseller.whatsappNumber && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">WA</span>
                    )}
                    {!reseller.instagramHandle && !reseller.facebookHandle && !reseller.youtubeHandle && !reseller.telegramHandle && !reseller.whatsappNumber && (
                      <span className="text-gray-500 text-xs">No social</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-luxury-gray">
                    {/* Approve/Reject buttons for pending */}
                    {reseller.registrationStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(reseller.id)}
                          disabled={processingId === reseller.id}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReject(reseller.id)}
                          disabled={processingId === reseller.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewProfile(reseller)}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <Link
                      href={`/admin/dashboard/resellers/edit/${reseller.id}`}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(reseller.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-luxury-gray rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Shop Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Social</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Store URL</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.map((reseller) => (
                  <tr key={reseller.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-luxury-gold/20 rounded-full flex items-center justify-center mr-3">
                          <span className="text-luxury-gold font-medium">
                            {reseller.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{reseller.name}</p>
                          <a href={`mailto:${reseller.email}`} className="text-gray-500 text-sm hover:text-luxury-gold block">
                            {reseller.email}
                          </a>
                          <p className="text-gray-600 text-xs mt-1">
                            Added: {formatDateTime(reseller.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{reseller.shopName}</td>
                    <td className="px-6 py-4">
                      <a href={`tel:${reseller.contactNumber}`} className="text-white hover:text-luxury-gold block">
                        {reseller.contactNumber}
                      </a>
                      {reseller.whatsappNumber && (
                        <a
                          href={getWhatsAppUrl(reseller.whatsappNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 text-sm flex items-center gap-1 hover:text-green-300 mt-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {reseller.whatsappNumber}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {reseller.instagramHandle && (
                          <a
                            href={getSocialUrl("instagram", reseller.instagramHandle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full hover:bg-pink-500/30 transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            {reseller.instagramHandle}
                          </a>
                        )}
                        {reseller.facebookHandle && (
                          <a
                            href={`https://facebook.com/${reseller.facebookHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full hover:bg-blue-500/30 transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </a>
                        )}
                        {reseller.youtubeHandle && (
                          <a
                            href={`https://youtube.com/@${reseller.youtubeHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full hover:bg-red-500/30 transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            YouTube
                          </a>
                        )}
                        {reseller.telegramHandle && (
                          <a
                            href={`https://t.me/${reseller.telegramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full hover:bg-blue-600/30 transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            Telegram
                          </a>
                        )}
                        {!reseller.instagramHandle && !reseller.facebookHandle && !reseller.youtubeHandle && !reseller.telegramHandle && (
                          <span className="text-gray-500 text-sm">No social</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {/* Default Store URL */}
                        {reseller.shopName && (
                          <div className="flex items-center gap-2">
                            <a
                              href={getStoreUrl(reseller.shopName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-luxury-gold hover:text-yellow-400 text-sm font-mono"
                            >
                              /{(reseller.shopName || "").toLowerCase().replace(/\s+/g, "")}
                            </a>
                            <button
                              onClick={() => copyToClipboard(getStoreUrl(reseller.shopName), reseller.id)}
                              className={`p-1.5 rounded transition-colors ${
                                copiedId === reseller.id
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-luxury-gray hover:bg-gray-600 text-gray-400 hover:text-white"
                              }`}
                              title={copiedId === reseller.id ? "Copied!" : "Copy URL"}
                            >
                              {copiedId === reseller.id ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                        {/* Custom Domain (if configured) */}
                        {reseller.customDomain && (
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://${reseller.customDomain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 text-xs"
                            >
                              {reseller.customDomain}
                            </a>
                            <button
                              onClick={() => copyToClipboard(`https://${reseller.customDomain}`, `${reseller.id}-domain`)}
                              className={`p-1 rounded transition-colors ${
                                copiedId === `${reseller.id}-domain`
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-luxury-gray hover:bg-gray-600 text-gray-400 hover:text-white"
                              }`}
                              title={copiedId === `${reseller.id}-domain` ? "Copied!" : "Copy URL"}
                            >
                              {copiedId === `${reseller.id}-domain` ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {/* Registration Status */}
                        <span
                          className={`px-3 py-1 text-sm rounded-full inline-block ${
                            reseller.registrationStatus === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : reseller.registrationStatus === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {reseller.registrationStatus}
                        </span>
                        {/* Account Status */}
                        {reseller.registrationStatus === "approved" && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full block w-fit ${
                              reseller.status === "active"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {reseller.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Approve/Reject buttons for pending */}
                        {reseller.registrationStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(reseller.id)}
                              disabled={processingId === reseller.id}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReject(reseller.id)}
                              disabled={processingId === reseller.id}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewProfile(reseller)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <Link
                          href={`/admin/dashboard/resellers/edit/${reseller.id}`}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-luxury-gray rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(reseller.id)}
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

          <div className="px-6 py-4 border-t border-luxury-gray flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              Showing {filteredResellers.length} of {resellers.length} reseller{resellers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
          )}

          {/* Summary Footer */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredResellers.length} of {resellers.length} resellers
            </p>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-luxury-gray sticky top-0 bg-luxury-dark">
              <h2 className="text-xl font-semibold text-white">Reseller Profile</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-luxury-gray rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-luxury-gold">
                    {selectedReseller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedReseller.name}</h3>
                  <p className="text-luxury-gold">{selectedReseller.shopName}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
                      selectedReseller.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {selectedReseller.status}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Email</p>
                      <a href={`mailto:${selectedReseller.email}`} className="text-white hover:text-luxury-gold">
                        {selectedReseller.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Phone</p>
                      <a href={`tel:${selectedReseller.contactNumber}`} className="text-white hover:text-luxury-gold">
                        {selectedReseller.contactNumber}
                      </a>
                    </div>
                  </div>

                  {selectedReseller.whatsappNumber && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">WhatsApp</p>
                        <a
                          href={getWhatsAppUrl(selectedReseller.whatsappNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300"
                        >
                          {selectedReseller.whatsappNumber}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedReseller.storeAddress && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Store Address</p>
                        <p className="text-white">{selectedReseller.storeAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Store URLs */}
              <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Store URLs</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs">Default Store</p>
                      {selectedReseller.shopName ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={getStoreUrl(selectedReseller.shopName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxury-gold hover:text-yellow-400"
                          >
                            /{(selectedReseller.shopName || "").toLowerCase().replace(/\s+/g, "")}
                          </a>
                          <button
                            onClick={() => copyToClipboard(getStoreUrl(selectedReseller.shopName), `modal-store-${selectedReseller.id}`)}
                            className="p-1 text-gray-400 hover:text-luxury-gold transition-colors"
                            title="Copy full URL"
                          >
                            {copiedId === `modal-store-${selectedReseller.id}` ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not configured</span>
                      )}
                    </div>
                  </div>

                  {selectedReseller.customDomain && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-400 text-xs">Custom Domain</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://${selectedReseller.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            {selectedReseller.customDomain}
                          </a>
                          <button
                            onClick={() => copyToClipboard(`https://${selectedReseller.customDomain}`, `modal-domain-${selectedReseller.id}`)}
                            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                            title="Copy full URL"
                          >
                            {copiedId === `modal-domain-${selectedReseller.id}` ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(selectedReseller.instagramHandle || selectedReseller.facebookHandle || selectedReseller.youtubeHandle || selectedReseller.telegramHandle) && (
                <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Social Media</h4>

                  <div className="flex flex-wrap gap-2">
                    {selectedReseller.instagramHandle && (
                      <a
                        href={getSocialUrl("instagram", selectedReseller.instagramHandle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {selectedReseller.instagramHandle}
                      </a>
                    )}
                    {selectedReseller.facebookHandle && (
                      <a
                        href={`https://facebook.com/${selectedReseller.facebookHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </a>
                    )}
                    {selectedReseller.youtubeHandle && (
                      <a
                        href={`https://youtube.com/@${selectedReseller.youtubeHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        YouTube
                      </a>
                    )}
                    {selectedReseller.telegramHandle && (
                      <a
                        href={`https://t.me/${selectedReseller.telegramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Account Info</h4>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Member Since</p>
                    <p className="text-white">{formatDateTime(selectedReseller.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-luxury-gray">
              <Link
                href={`/admin/dashboard/resellers/edit/${selectedReseller.id}`}
                className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              <button
                onClick={closeModal}
                className="bg-luxury-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ResellerList() {
  return (
    <Suspense fallback={
      <AdminLayout title="Resellers">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading...</div>
        </div>
      </AdminLayout>
    }>
      <ResellerListContent />
    </Suspense>
  );
}
