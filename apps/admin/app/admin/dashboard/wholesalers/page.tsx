"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useWholesalers, Wholesaler } from "@/src/hooks/entities";

function WholesalerListContent() {
  const { wholesalers, loading, deleteWholesaler, approveWholesaler, rejectWholesaler } = useWholesalers();
  const searchParams = useSearchParams();
  const [selectedWholesaler, setSelectedWholesaler] = useState<Wholesaler | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "pending" || status === "approved" || status === "rejected") {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const handleViewProfile = (wholesaler: Wholesaler) => {
    setSelectedWholesaler(wholesaler);
    setShowProfileModal(true);
  };

  const closeModal = () => {
    setShowProfileModal(false);
    setSelectedWholesaler(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this wholesaler?")) {
      try {
        await deleteWholesaler(id);
      } catch (error) {
        alert("Failed to delete wholesaler. Please try again.");
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm("Approve this wholesaler? They will be able to login after approval.")) {
      try {
        setProcessingId(id);
        await approveWholesaler(id);
      } catch (error) {
        alert("Failed to approve wholesaler. Please try again.");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Reject this wholesaler? They will not be able to login.")) {
      try {
        setProcessingId(id);
        await rejectWholesaler(id);
      } catch (error) {
        alert("Failed to reject wholesaler. Please try again.");
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
    });
  };

  const pendingCount = wholesalers.filter((w) => w.registrationStatus === "pending").length;

  const filteredWholesalers = wholesalers.filter((wholesaler) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      wholesaler.name.toLowerCase().includes(search) ||
      wholesaler.companyName?.toLowerCase().includes(search) ||
      wholesaler.email?.toLowerCase().includes(search) ||
      wholesaler.contactNumber?.includes(search)
    );

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && wholesaler.registrationStatus === statusFilter;
  });

  return (
    <AdminLayout
      title="Wholesaler List"
      actions={
        <Link
          href="/admin/dashboard/wholesalers/new"
          className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Wholesaler
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
                  New wholesaler registration{pendingCount > 1 ? "s" : ""} waiting for your review
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
      ) : wholesalers.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No wholesalers yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first wholesaler</p>
          <Link
            href="/admin/dashboard/wholesalers/new"
            className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Wholesaler
          </Link>
        </div>
      ) : (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
          {/* Search, Filter and View Toggle */}
          <div className="p-4 border-b border-luxury-gray flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, company, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === status
                      ? status === "pending"
                        ? "bg-yellow-500 text-black"
                        : status === "approved"
                        ? "bg-green-500 text-black"
                        : status === "rejected"
                        ? "bg-red-500 text-white"
                        : "bg-luxury-gold text-black"
                      : "bg-luxury-gray text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
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

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWholesalers.map((wholesaler) => (
                <div
                  key={wholesaler.id}
                  className="bg-luxury-gray/30 rounded-xl p-4 hover:bg-luxury-gray/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-lg">
                        {wholesaler.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      wholesaler.registrationStatus === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : wholesaler.registrationStatus === "approved"
                        ? wholesaler.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {wholesaler.registrationStatus === "approved"
                        ? wholesaler.status === "active" ? "Active" : "Inactive"
                        : wholesaler.registrationStatus.charAt(0).toUpperCase() + wholesaler.registrationStatus.slice(1)
                      }
                    </span>
                  </div>
                  {/* Content */}
                  <h3 className="text-white font-medium mb-1">{wholesaler.name}</h3>
                  {wholesaler.companyName && (
                    <p className="text-gray-400 text-sm mb-2">{wholesaler.companyName}</p>
                  )}
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-500">{wholesaler.email || "No email"}</p>
                    <p className="text-gray-500">{wholesaler.contactNumber || "-"}</p>
                    {wholesaler.city && <p className="text-gray-500">{wholesaler.city}</p>}
                  </div>
                  <p className="text-gray-600 text-xs mb-3">Joined {formatDateTime(wholesaler.createdAt)}</p>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-luxury-gray">
                    {wholesaler.registrationStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(wholesaler.id)}
                          disabled={processingId === wholesaler.id}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReject(wholesaler.id)}
                          disabled={processingId === wholesaler.id}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewProfile(wholesaler)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <Link
                      href={`/admin/dashboard/wholesalers/edit/${wholesaler.id}`}
                      className="p-2 text-luxury-gold hover:bg-luxury-gold/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(wholesaler.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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

          {/* List/Table View */}
          {viewMode === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-luxury-gray/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Wholesaler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-gray">
                  {filteredWholesalers.map((wholesaler) => (
                    <tr key={wholesaler.id} className="hover:bg-luxury-gray/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-purple-400 font-semibold text-sm">
                              {wholesaler.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-white font-medium">{wholesaler.name}</p>
                            <p className="text-gray-500 text-sm">{wholesaler.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-white">{wholesaler.companyName || "-"}</p>
                        {wholesaler.gstNumber && (
                          <p className="text-gray-500 text-xs">GST: {wholesaler.gstNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-gray-300">{wholesaler.contactNumber || "-"}</p>
                        {wholesaler.city && (
                          <p className="text-gray-500 text-sm">{wholesaler.city}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          wholesaler.registrationStatus === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : wholesaler.registrationStatus === "approved"
                            ? wholesaler.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {wholesaler.registrationStatus === "approved"
                            ? wholesaler.status === "active" ? "Active" : "Inactive"
                            : wholesaler.registrationStatus.charAt(0).toUpperCase() + wholesaler.registrationStatus.slice(1)
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {formatDateTime(wholesaler.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {wholesaler.registrationStatus === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(wholesaler.id)}
                                disabled={processingId === wholesaler.id}
                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(wholesaler.id)}
                                disabled={processingId === wholesaler.id}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewProfile(wholesaler)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <Link
                            href={`/admin/dashboard/wholesalers/edit/${wholesaler.id}`}
                            className="p-2 text-luxury-gold hover:bg-luxury-gold/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(wholesaler.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
          )}

          {filteredWholesalers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No wholesalers match your search criteria
            </div>
          )}
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedWholesaler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-luxury-dark border border-luxury-gray rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-luxury-dark border-b border-luxury-gray p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Wholesaler Profile</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-400 font-bold text-2xl">
                    {selectedWholesaler.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">{selectedWholesaler.name}</h4>
                  {selectedWholesaler.companyName && (
                    <p className="text-gray-400">{selectedWholesaler.companyName}</p>
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedWholesaler.registrationStatus === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : selectedWholesaler.registrationStatus === "approved"
                      ? selectedWholesaler.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {selectedWholesaler.registrationStatus === "approved"
                      ? selectedWholesaler.status === "active" ? "Active" : "Inactive"
                      : selectedWholesaler.registrationStatus.charAt(0).toUpperCase() + selectedWholesaler.registrationStatus.slice(1)
                    }
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-luxury-gray/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedWholesaler.email && (
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="text-white">{selectedWholesaler.email}</p>
                    </div>
                  )}
                  {selectedWholesaler.contactNumber && (
                    <div>
                      <p className="text-gray-500 text-xs">Phone</p>
                      <p className="text-white">{selectedWholesaler.contactNumber}</p>
                    </div>
                  )}
                  {selectedWholesaler.whatsappNumber && (
                    <div>
                      <p className="text-gray-500 text-xs">WhatsApp</p>
                      <p className="text-white">{selectedWholesaler.whatsappNumber}</p>
                    </div>
                  )}
                  {selectedWholesaler.city && (
                    <div>
                      <p className="text-gray-500 text-xs">City</p>
                      <p className="text-white">{selectedWholesaler.city}</p>
                    </div>
                  )}
                </div>
                {selectedWholesaler.address && (
                  <div>
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-white">{selectedWholesaler.address}</p>
                  </div>
                )}
              </div>

              {/* Business Info */}
              {selectedWholesaler.gstNumber && (
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Business Information</h4>
                  <div>
                    <p className="text-gray-500 text-xs">GST Number</p>
                    <p className="text-white font-mono">{selectedWholesaler.gstNumber}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href={`/admin/dashboard/wholesalers/edit/${selectedWholesaler.id}`}
                  className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-medium py-2 rounded-lg text-center transition-colors"
                >
                  Edit Wholesaler
                </Link>
                <button
                  onClick={() => {
                    closeModal();
                    handleDelete(selectedWholesaler.id);
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function WholesalerList() {
  return (
    <Suspense fallback={
      <AdminLayout title="Wholesalers">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading...</div>
        </div>
      </AdminLayout>
    }>
      <WholesalerListContent />
    </Suspense>
  );
}
