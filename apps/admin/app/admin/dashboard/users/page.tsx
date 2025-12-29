"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";

type UserType = "wholesaler" | "reseller" | "retailer";

interface Category {
  id: string;
  name: string;
}

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
  selectedCategories: Category[];
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
    label: "Customer",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
  },
};

interface NewUserForm {
  userType: UserType;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  companyName: string;
  shopName: string;
}

const initialFormState: NewUserForm = {
  userType: "retailer",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  contactNumber: "",
  companyName: "",
  shopName: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | UserType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>(initialFormState);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "block" | "unblock" | "delete";
    user: User;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleBlockUser = async (user: User) => {
    setActionLoading(true);
    try {
      const newStatus = user.status === "blocked" ? "active" : "blocked";
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentType: user.userType,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await fetchUsers();
        setConfirmAction(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } catch {
      alert("Error updating user");
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async (user: User) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}&userType=${user.userType}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchUsers();
        setConfirmAction(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Error deleting user");
    }
    setActionLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    // Validate password match
    if (newUser.password && newUser.password !== newUser.confirmPassword) {
      setCreateError("Passwords do not match");
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          whatsappNumber: newUser.contactNumber, // Use same number for WhatsApp
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchUsers();
        setShowAddModal(false);
        setNewUser(initialFormState);
      } else {
        setCreateError(data.error || "Failed to create user");
      }
    } catch {
      setCreateError("Error creating user");
    }
    setCreating(false);
  };

  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
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

      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm">Manage all users across user types</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

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
          <p className="text-green-400 text-sm">Customers</p>
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
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "blocked")}
            className="px-3 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
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
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Categories</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                        {user.selectedCategories && user.selectedCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {user.selectedCategories.slice(0, 3).map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-luxury-gray text-gray-300 text-xs"
                              >
                                {cat.name}
                              </span>
                            ))}
                            {user.selectedCategories.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold text-xs">
                                +{user.selectedCategories.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {user.userType === "retailer" ? "—" : "No categories"}
                          </span>
                        )}
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
                            : user.status === "blocked"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {user.status === "active" ? "Active" : user.status === "blocked" ? "Blocked" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Type */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-luxury-gray rounded-lg text-gray-400 hover:text-luxury-gold transition-colors"
                            title="Change Type"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          {/* Block/Unblock */}
                          <button
                            onClick={() => setConfirmAction({
                              type: user.status === "blocked" ? "unblock" : "block",
                              user,
                            })}
                            className={`p-2 hover:bg-luxury-gray rounded-lg transition-colors ${
                              user.status === "blocked"
                                ? "text-orange-400 hover:text-green-400"
                                : "text-gray-400 hover:text-orange-400"
                            }`}
                            title={user.status === "blocked" ? "Unblock User" : "Block User"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {user.status === "blocked" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              )}
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmAction({ type: "delete", user })}
                            className="p-2 hover:bg-luxury-gray rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add New User</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser(initialFormState);
                  setCreateError("");
                }}
                className="p-2 hover:bg-luxury-gray rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["wholesaler", "reseller", "retailer"] as UserType[]).map((type) => {
                    const config = USER_TYPE_CONFIG[type];
                    const isSelected = newUser.userType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleInputChange("userType", type)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? `${config.bgColor} ${config.color} border-2 ${config.borderColor}`
                            : "bg-luxury-gray text-gray-400 hover:text-white border-2 border-transparent hover:border-luxury-gray"
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contact / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={newUser.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Password */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${newUser.userType === "retailer" ? "mb-6" : "mb-4"}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`w-full px-4 py-2 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold ${
                      newUser.confirmPassword && newUser.password !== newUser.confirmPassword
                        ? "border-red-500"
                        : "border-luxury-gray"
                    }`}
                    placeholder="••••••••"
                  />
                  {newUser.confirmPassword && newUser.password !== newUser.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Type-specific fields */}
              {newUser.userType === "wholesaler" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newUser.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="Company name"
                  />
                </div>
              )}

              {newUser.userType === "reseller" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={newUser.shopName}
                    onChange={(e) => handleInputChange("shopName", e.target.value)}
                    className="w-full px-4 py-2 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    placeholder="Shop name"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser(initialFormState);
                    setCreateError("");
                  }}
                  className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newUser.name}
                  className="px-6 py-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal (Block/Unblock/Delete) */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                confirmAction.type === "delete"
                  ? "bg-red-500/20"
                  : confirmAction.type === "block"
                  ? "bg-orange-500/20"
                  : "bg-green-500/20"
              }`}>
                {confirmAction.type === "delete" ? (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : confirmAction.type === "block" ? (
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {confirmAction.type === "delete"
                    ? "Delete User"
                    : confirmAction.type === "block"
                    ? "Block User"
                    : "Unblock User"}
                </h3>
                <p className="text-gray-400 text-sm">This action requires confirmation</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-luxury-gray/50 rounded-lg">
              <p className="text-white font-medium">{confirmAction.user.name}</p>
              {confirmAction.user.email && (
                <p className="text-gray-400 text-sm">{confirmAction.user.email}</p>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${
                USER_TYPE_CONFIG[confirmAction.user.userType].bgColor
              } ${USER_TYPE_CONFIG[confirmAction.user.userType].color}`}>
                {USER_TYPE_CONFIG[confirmAction.user.userType].label}
              </span>
            </div>

            <p className="text-gray-300 mb-6">
              {confirmAction.type === "delete"
                ? "Are you sure you want to permanently delete this user? This action cannot be undone."
                : confirmAction.type === "block"
                ? "Are you sure you want to block this user? They will not be able to log in until unblocked."
                : "Are you sure you want to unblock this user? They will be able to log in again."}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "delete") {
                    handleDeleteUser(confirmAction.user);
                  } else {
                    handleBlockUser(confirmAction.user);
                  }
                }}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  confirmAction.type === "delete"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : confirmAction.type === "block"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmAction.type === "delete"
                      ? "Delete User"
                      : confirmAction.type === "block"
                      ? "Block User"
                      : "Unblock User"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
