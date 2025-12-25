"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";

type UserType = "wholesaler" | "reseller" | "retailer";

interface User {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  city: string | null;
  userType: UserType;
  status: string;
  registrationStatus: string;
  createdAt: string;
}

const USER_TYPE_CONFIG = {
  wholesaler: {
    label: "Wholesaler",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
  },
  reseller: {
    label: "Reseller",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
  },
  retailer: {
    label: "Retailer",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
  },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | UserType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError("Failed to fetch users");
      }
    } catch {
      setError("Error loading users");
    }
    setLoading(false);
  };

  const handleUpdateUser = async (userId: string, currentType: UserType, newType: UserType, status: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentType, newType, status }),
      });

      if (res.ok) {
        await fetchUsers();
        setEditingUser(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } catch {
      alert("Error updating user");
    }
    setUpdating(false);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    await handleUpdateUser(user.id, user.userType, user.userType, newStatus);
  };

  const filteredUsers = users.filter((user) => {
    if (filter !== "all" && user.userType !== filter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <AdminLayout title="All Users">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="All Users">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-blue-500/30 p-4">
          <p className="text-blue-400 text-sm">Wholesalers</p>
          <p className="text-2xl font-bold text-blue-400">
            {users.filter((u) => u.userType === "wholesaler").length}
          </p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-purple-500/30 p-4">
          <p className="text-purple-400 text-sm">Resellers</p>
          <p className="text-2xl font-bold text-purple-400">
            {users.filter((u) => u.userType === "reseller").length}
          </p>
        </div>
        <div className="bg-luxury-dark rounded-lg border border-green-500/30 p-4">
          <p className="text-green-400 text-sm">Retailers</p>
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.userType === "retailer").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-luxury-dark rounded-lg border border-luxury-gray p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {(["all", "wholesaler", "reseller", "retailer"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? type === "all"
                      ? "bg-luxury-gold text-black"
                      : `${USER_TYPE_CONFIG[type as UserType].bgColor} ${USER_TYPE_CONFIG[type as UserType].color}`
                    : "bg-luxury-gray text-gray-400 hover:text-white"
                }`}
              >
                {type === "all" ? "All" : USER_TYPE_CONFIG[type as UserType].label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-luxury-dark rounded-lg border border-luxury-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-luxury-gray">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const config = USER_TYPE_CONFIG[user.userType];
                  return (
                    <tr key={`${user.userType}-${user.id}`} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          {user.username && (
                            <p className="text-gray-500 text-sm">@{user.username}</p>
                          )}
                          {user.companyName && (
                            <p className="text-gray-500 text-xs">{user.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {user.email && <p className="text-gray-300">{user.email}</p>}
                          {user.phone && <p className="text-gray-500">{user.phone}</p>}
                          {user.city && <p className="text-gray-500">{user.city}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-luxury-gray rounded-lg text-gray-400 hover:text-luxury-gold transition-colors"
                            title="Change Type"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 hover:bg-luxury-gray rounded-lg transition-colors ${
                              user.status === "active"
                                ? "text-green-400 hover:text-red-400"
                                : "text-red-400 hover:text-green-400"
                            }`}
                            title={user.status === "active" ? "Deactivate" : "Activate"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {user.status === "active" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Change User Type</h3>
            <div className="mb-4">
              <p className="text-gray-400">
                <span className="text-white font-medium">{editingUser.name}</span>
                {editingUser.email && <span className="text-sm"> ({editingUser.email})</span>}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current type:{" "}
                <span className={USER_TYPE_CONFIG[editingUser.userType].color}>
                  {USER_TYPE_CONFIG[editingUser.userType].label}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select New Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["wholesaler", "reseller", "retailer"] as UserType[]).map((type) => {
                  const config = USER_TYPE_CONFIG[type];
                  const isSelected = type === editingUser.userType;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (type !== editingUser.userType) {
                          if (confirm(`Change ${editingUser.name} from ${USER_TYPE_CONFIG[editingUser.userType].label} to ${config.label}? This action will move the user to a different pricing tier.`)) {
                            handleUpdateUser(editingUser.id, editingUser.userType, type, editingUser.status);
                          }
                        }
                      }}
                      disabled={updating}
                      className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? `${config.bgColor} ${config.color} border-2 ${config.borderColor}`
                          : "bg-luxury-gray text-gray-400 hover:text-white border-2 border-transparent hover:border-luxury-gray"
                      } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {config.label}
                      {isSelected && " (Current)"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
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
