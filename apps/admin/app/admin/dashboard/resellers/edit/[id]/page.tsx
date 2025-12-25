"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/src/components/layouts/AdminLayout";

interface Reseller {
  id: string;
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  shopName: string;
  email: string;
  storeAddress: string;
  createdAt: string;
  status: string;
  customDomain?: string;
  storeLogo?: string;
  storeBanner?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
}

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "text-pink-400" },
  { value: "facebook", label: "Facebook", color: "text-blue-400" },
  { value: "youtube", label: "YouTube", color: "text-red-500" },
  { value: "twitter", label: "Twitter/X", color: "text-gray-400" },
  { value: "linkedin", label: "LinkedIn", color: "text-blue-500" },
  { value: "tiktok", label: "TikTok", color: "text-white" },
  { value: "pinterest", label: "Pinterest", color: "text-red-400" },
  { value: "telegram", label: "Telegram", color: "text-blue-400" },
  { value: "threads", label: "Threads", color: "text-white" },
  { value: "website", label: "Website", color: "text-green-400" },
];

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

export default function EditReseller() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: "",
    contactNumber: "",
    whatsappNumber: "",
    shopName: "",
    email: "",
    storeAddress: "",
    customDomain: "",
    status: "active",
    createdAt: "",
  });

  // Store branding images
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeBanner, setStoreBanner] = useState<string | null>(null);

  // Social accounts
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { id: "1", platform: "instagram", handle: "" }
  ]);
  const [showAddSocialDropdown, setShowAddSocialDropdown] = useState(false);

  // Social account handlers
  const addSocialAccount = (platform: string) => {
    setSocialAccounts((prev) => [...prev, { id: Date.now().toString(), platform, handle: "" }]);
    setShowAddSocialDropdown(false);
  };
  const removeSocialAccount = (id: string) => {
    setSocialAccounts((prev) => prev.filter((item) => item.id !== id));
  };
  const updateSocialAccount = (id: string, handle: string) => {
    setSocialAccounts((prev) => prev.map((item) => (item.id === id ? { ...item, handle } : item)));
  };
  const getPlatformInfo = (platform: string) => {
    return SOCIAL_PLATFORMS.find((p) => p.value === platform) || { label: platform, color: "text-gray-400" };
  };
  const getAvailablePlatforms = () => {
    const usedPlatforms = socialAccounts.map((s) => s.platform);
    return SOCIAL_PLATFORMS.filter((p) => !usedPlatforms.includes(p.value));
  };

  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function (exactly 10 digits starting with 6-9)
  const validateIndianPhone = (phone: string): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, "");
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  // Get phone validation error message
  const getPhoneValidationError = (phone: string): string | null => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 0) return null;
    if (cleaned.length < 10) {
      return `Enter ${10 - cleaned.length} more digit${10 - cleaned.length > 1 ? 's' : ''}`;
    }
    if (cleaned.length > 10) {
      return "Number too long (max 10 digits)";
    }
    if (!/^[6-9]/.test(cleaned)) {
      return "Must start with 6, 7, 8 or 9";
    }
    return null;
  };

  // Format phone number - only digits, max 10
  const formatPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/\D/g, "");
    // Remove leading 91 if user pastes full number
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    // Remove leading 0 if present
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }
    return cleaned;
  };

  // Handle image upload
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Availability states
  const [availability, setAvailability] = useState<{
    shopName: AvailabilityStatus;
    email: AvailabilityStatus;
    contactNumber: AvailabilityStatus;
    whatsappNumber: AvailabilityStatus;
    customDomain: AvailabilityStatus;
  }>({
    shopName: "idle",
    email: "idle",
    contactNumber: "idle",
    whatsappNumber: "idle",
    customDomain: "idle",
  });

  // Original values to compare against
  const [originalValues, setOriginalValues] = useState({
    shopName: "",
    email: "",
    contactNumber: "",
    whatsappNumber: "",
    customDomain: "",
  });

  // Check availability function (excludes current reseller)
  const checkAvailability = async (field: keyof typeof availability, value: string, originalValue: string) => {
    if (!value.trim()) {
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
      return;
    }

    // If value is same as original, it's available (no change)
    const normalizedValue = field === "shopName"
      ? value.toLowerCase().replace(/\s+/g, "")
      : field === "contactNumber" || field === "whatsappNumber"
      ? value.replace(/[\s\-\(\)\+]/g, "")
      : value.toLowerCase();

    const normalizedOriginal = field === "shopName"
      ? originalValue.toLowerCase().replace(/\s+/g, "")
      : field === "contactNumber" || field === "whatsappNumber"
      ? originalValue.replace(/[\s\-\(\)\+]/g, "")
      : originalValue.toLowerCase();

    if (normalizedValue === normalizedOriginal) {
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
      return;
    }

    setAvailability((prev) => ({ ...prev, [field]: "checking" }));

    try {
      const res = await fetch("/api/resellers");
      if (!res.ok) throw new Error("Failed to fetch resellers");

      const resellers: Reseller[] = await res.json();
      // Exclude current reseller when checking
      const otherResellers = resellers.filter((r) => r.id !== id);
      let isTaken = false;

      if (field === "shopName") {
        const username = value.toLowerCase().replace(/\s+/g, "");
        isTaken = otherResellers.some((r) => r.shopName.toLowerCase().replace(/\s+/g, "") === username);
      } else if (field === "email") {
        isTaken = otherResellers.some((r) => r.email.toLowerCase() === value.toLowerCase());
      } else if (field === "contactNumber") {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        isTaken = otherResellers.some((r) => r.contactNumber?.replace(/[\s\-\(\)\+]/g, "") === cleanNumber);
      } else if (field === "whatsappNumber") {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        isTaken = otherResellers.some((r) => r.whatsappNumber?.replace(/[\s\-\(\)\+]/g, "") === cleanNumber);
      } else if (field === "customDomain") {
        isTaken = otherResellers.some((r) => r.customDomain?.toLowerCase() === value.toLowerCase());
      }

      setAvailability((prev) => ({ ...prev, [field]: isTaken ? "taken" : "available" }));
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
    }
  };

  // Debounced availability checks
  useEffect(() => {
    if (!loading && form.shopName) {
      const timer = setTimeout(() => checkAvailability("shopName", form.shopName, originalValues.shopName), 500);
      return () => clearTimeout(timer);
    }
  }, [form.shopName, loading, originalValues.shopName]);

  useEffect(() => {
    if (!loading && form.email) {
      // Validate email format first
      if (form.email && !validateEmail(form.email)) {
        setEmailError("Invalid email format");
        setAvailability((prev) => ({ ...prev, email: "idle" }));
        return;
      }
      setEmailError(null);
      const timer = setTimeout(() => checkAvailability("email", form.email, originalValues.email), 500);
      return () => clearTimeout(timer);
    } else {
      setEmailError(null);
    }
  }, [form.email, loading, originalValues.email]);

  useEffect(() => {
    if (!loading && form.contactNumber) {
      // Validate phone format first
      const phoneError = getPhoneValidationError(form.contactNumber);
      if (phoneError) {
        setContactError(phoneError);
        setAvailability((prev) => ({ ...prev, contactNumber: "idle" }));
        return;
      }
      setContactError(null);
      // Only check availability if valid (10 digits)
      if (form.contactNumber.length === 10) {
        const timer = setTimeout(() => checkAvailability("contactNumber", form.contactNumber, originalValues.contactNumber), 500);
        return () => clearTimeout(timer);
      }
    } else {
      setContactError(null);
    }
  }, [form.contactNumber, loading, originalValues.contactNumber]);

  useEffect(() => {
    if (!loading && form.whatsappNumber) {
      // Validate phone format first
      const phoneError = getPhoneValidationError(form.whatsappNumber);
      if (phoneError) {
        setWhatsappError(phoneError);
        setAvailability((prev) => ({ ...prev, whatsappNumber: "idle" }));
        return;
      }
      setWhatsappError(null);
      // Only check availability if valid (10 digits)
      if (form.whatsappNumber.length === 10) {
        const timer = setTimeout(() => checkAvailability("whatsappNumber", form.whatsappNumber, originalValues.whatsappNumber), 500);
        return () => clearTimeout(timer);
      }
    } else {
      setWhatsappError(null);
    }
  }, [form.whatsappNumber, loading, originalValues.whatsappNumber]);

  useEffect(() => {
    if (!loading && form.customDomain) {
      const timer = setTimeout(() => checkAvailability("customDomain", form.customDomain, originalValues.customDomain), 500);
      return () => clearTimeout(timer);
    }
  }, [form.customDomain, loading, originalValues.customDomain]);

  // Availability indicator component
  const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
    if (status === "idle") return null;
    if (status === "checking") {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Checking...
        </span>
      );
    }
    if (status === "available") {
      return (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Available
        </span>
      );
    }
    if (status === "taken") {
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Already taken
        </span>
      );
    }
    return null;
  };

  const hasAvailabilityError =
    availability.shopName === "taken" ||
    availability.email === "taken" ||
    availability.contactNumber === "taken";

  useEffect(() => {
    const fetchReseller = async () => {
      try {
        const res = await fetch(`/api/resellers/${id}`);

        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const reseller = await res.json();

        // Strip +91 prefix from phone numbers for display
        const stripPrefix = (phone: string | null | undefined): string => {
          if (!phone) return "";
          return phone.replace(/^\+91/, "");
        };

        setForm({
          name: reseller.name || "",
          contactNumber: stripPrefix(reseller.contactNumber),
          whatsappNumber: stripPrefix(reseller.whatsappNumber),
          shopName: reseller.shopName || "",
          email: reseller.email || "",
          storeAddress: reseller.storeAddress || "",
          customDomain: reseller.customDomain || "",
          status: reseller.status || "active",
          createdAt: reseller.createdAt || "",
        });

        // Build social accounts from existing data
        const accounts: SocialAccount[] = [];
        if (reseller.instagramHandle) {
          accounts.push({ id: "instagram", platform: "instagram", handle: reseller.instagramHandle });
        }
        if (reseller.facebookHandle) {
          accounts.push({ id: "facebook", platform: "facebook", handle: reseller.facebookHandle });
        }
        if (reseller.youtubeHandle) {
          accounts.push({ id: "youtube", platform: "youtube", handle: reseller.youtubeHandle });
        }
        if (reseller.telegramHandle) {
          accounts.push({ id: "telegram", platform: "telegram", handle: reseller.telegramHandle });
        }
        // If no social accounts, add empty Instagram as default
        if (accounts.length === 0) {
          accounts.push({ id: "1", platform: "instagram", handle: "" });
        }
        setSocialAccounts(accounts);

        // Store original values for comparison (also strip prefix for comparison)
        setOriginalValues({
          shopName: reseller.shopName || "",
          email: reseller.email || "",
          contactNumber: stripPrefix(reseller.contactNumber),
          whatsappNumber: stripPrefix(reseller.whatsappNumber),
          customDomain: reseller.customDomain || "",
        });

        // Set store branding images
        if (reseller.storeLogo) {
          setStoreLogo(reseller.storeLogo);
        }
        if (reseller.storeBanner) {
          setStoreBanner(reseller.storeBanner);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching reseller:", error);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchReseller();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle phone number fields (only 10 digits)
    if (name === "contactNumber" || name === "whatsappNumber") {
      const formattedValue = formatPhoneNumber(value);
      setForm((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (form.email && !validateEmail(form.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (form.contactNumber && form.contactNumber !== "+91" && !validateIndianPhone(form.contactNumber)) {
      alert("Please enter a valid Indian mobile number (+91 followed by 10 digits)");
      return;
    }

    if (form.whatsappNumber && form.whatsappNumber !== "+91" && !validateIndianPhone(form.whatsappNumber)) {
      alert("Please enter a valid Indian WhatsApp number (+91 followed by 10 digits)");
      return;
    }

    setSubmitting(true);

    try {
      // Extract social accounts for API fields
      const instagramAccount = socialAccounts.find((s) => s.platform === "instagram" && s.handle.trim());
      const facebookAccount = socialAccounts.find((s) => s.platform === "facebook" && s.handle.trim());
      const twitterAccount = socialAccounts.find((s) => s.platform === "twitter" && s.handle.trim());
      const linkedinAccount = socialAccounts.find((s) => s.platform === "linkedin" && s.handle.trim());

      const updatedReseller = {
        name: form.name,
        // Prepend +91 to phone numbers before sending to API
        contactNumber: form.contactNumber ? `+91${form.contactNumber}` : null,
        whatsappNumber: form.whatsappNumber ? `+91${form.whatsappNumber}` : null,
        shopName: form.shopName,
        email: form.email,
        storeAddress: form.storeAddress,
        customDomain: form.customDomain || null,
        status: form.status,
        storeLogo: storeLogo,
        storeBanner: storeBanner,
        instagramHandle: instagramAccount?.handle || null,
        facebookUrl: facebookAccount?.handle || null,
        xUrl: twitterAccount?.handle || null,
        linkedinUrl: linkedinAccount?.handle || null,
      };

      const res = await fetch(`/api/resellers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReseller),
      });

      if (!res.ok) {
        throw new Error("Failed to update reseller");
      }

      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/dashboard/resellers");
      }, 1500);
    } catch (error) {
      setSubmitting(false);
      alert("Failed to update reseller. Please try again.");
    }
  };

  // Check for validation errors
  const hasValidationErrors =
    emailError !== null ||
    contactError !== null ||
    whatsappError !== null;

  if (loading) {
    return (
      <AdminLayout title="Edit Reseller">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout title="Edit Reseller">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg">
          Reseller not found.{" "}
          <Link href="/admin/dashboard/resellers" className="underline">
            Go back to list
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Reseller"
      actions={
        <Link href="/admin/dashboard/resellers" className="text-gray-400 hover:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </Link>
      }
    >
      {success ? (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-6 py-4 rounded-lg mb-6">
          Reseller updated successfully! Redirecting to list...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 max-w-4xl">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  {emailError ? (
                    <span className="text-xs text-red-400">{emailError}</span>
                  ) : (
                    <AvailabilityIndicator status={availability.email} />
                  )}
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                    emailError || availability.email === "taken" ? "border-red-500" : availability.email === "available" ? "border-green-500" : "border-gray-600"
                  }`}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-300">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  {contactError ? (
                    <span className="text-xs text-red-400">{contactError}</span>
                  ) : (
                    <AvailabilityIndicator status={availability.contactNumber} />
                  )}
                </div>
                <div className={`flex items-center bg-luxury-gray border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-luxury-gold focus-within:border-transparent ${
                  contactError || availability.contactNumber === "taken" ? "border-red-500" : availability.contactNumber === "available" ? "border-green-500" : "border-gray-600"
                }`}>
                  <span className="px-4 py-3 bg-gray-700 text-gray-300 font-medium border-r border-gray-600 select-none">+91</span>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-300">
                    WhatsApp Number
                  </label>
                  {whatsappError ? (
                    <span className="text-xs text-red-400">{whatsappError}</span>
                  ) : (
                    <AvailabilityIndicator status={availability.whatsappNumber} />
                  )}
                </div>
                <div className={`flex items-center bg-luxury-gray border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-luxury-gold focus-within:border-transparent ${
                  whatsappError || availability.whatsappNumber === "taken" ? "border-red-500" : availability.whatsappNumber === "available" ? "border-green-500" : "border-gray-600"
                }`}>
                  <span className="px-4 py-3 bg-gray-700 text-gray-300 font-medium border-r border-gray-600 select-none">+91</span>
                  <input
                    type="tel"
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={form.whatsappNumber}
                    onChange={handleChange}
                    maxLength={10}
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-300">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <AvailabilityIndicator status={availability.shopName} />
                </div>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                    availability.shopName === "taken" ? "border-red-500" : availability.shopName === "available" ? "border-green-500" : "border-gray-600"
                  }`}
                  placeholder="Enter shop name"
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
                <p className="text-xs text-gray-500 mt-1">
                  New resellers are inactive until they place their first order
                </p>
              </div>

              <div className="md:col-span-2 p-4 bg-luxury-gray/50 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Store URLs & White Label Setup
                </label>

                {/* Default URL Preview */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Default Store URL (auto-generated)</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-luxury-gray rounded-lg border border-gray-700">
                    <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-luxury-gold">
                      https://myluxury.network/{form.shopName ? form.shopName.toLowerCase().replace(/\s+/g, "") : "<shopname>"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">This URL is always active and shows all your products</p>
                </div>

                {/* Custom Domain Section */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">Custom Domain (White Label)</p>
                    <AvailabilityIndicator status={availability.customDomain} />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Connect your own domain to display products under your brand</p>

                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">https://</span>
                    <input
                      type="text"
                      id="customDomain"
                      name="customDomain"
                      value={form.customDomain}
                      onChange={handleChange}
                      className={`w-full pl-20 pr-4 py-3 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                        availability.customDomain === "taken" ? "border-red-500" : availability.customDomain === "available" ? "border-green-500" : "border-gray-600"
                      }`}
                      placeholder="store.yourdomain.com"
                    />
                  </div>

                  {/* DNS Configuration Info */}
                  {form.customDomain && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        DNS Configuration Required
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        To connect <span className="text-white font-medium">{form.customDomain}</span>, the reseller needs to update their domain DNS settings:
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-16 flex-shrink-0">Option 1:</span>
                          <div>
                            <p className="text-gray-300">Add CNAME record pointing to:</p>
                            <code className="text-green-400 bg-black/30 px-2 py-1 rounded mt-1 inline-block">proxy.myluxury.network</code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-16 flex-shrink-0">Option 2:</span>
                          <div>
                            <p className="text-gray-300">Update nameservers to:</p>
                            <code className="text-green-400 bg-black/30 px-2 py-1 rounded mt-1 block">ns1.myluxury.network</code>
                            <code className="text-green-400 bg-black/30 px-2 py-1 rounded mt-1 block">ns2.myluxury.network</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-300 mb-2">
                  Store Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="storeAddress"
                  name="storeAddress"
                  value={form.storeAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent resize-none"
                  placeholder="Enter complete store address"
                />
              </div>
            </div>
          </div>

          {/* Store Branding Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Store Branding
              <span className="text-xs font-normal text-gray-500">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Logo
                </label>
                <p className="text-xs text-gray-500 mb-3">Recommended: 200x200px, PNG or JPG</p>
                <div className="flex items-start gap-4">
                  {storeLogo ? (
                    <div className="relative">
                      <Image
                        src={storeLogo}
                        alt="Store Logo"
                        width={100}
                        height={100}
                        className="rounded-lg border border-gray-600 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStoreLogo(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-[100px] h-[100px] border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setStoreLogo)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Store Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Banner
                </label>
                <p className="text-xs text-gray-500 mb-3">Recommended: 1200x400px, PNG or JPG</p>
                <div className="flex items-start gap-4">
                  {storeBanner ? (
                    <div className="relative">
                      <Image
                        src={storeBanner}
                        alt="Store Banner"
                        width={200}
                        height={67}
                        className="rounded-lg border border-gray-600 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStoreBanner(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-[200px] h-[67px] border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-gray-500 mt-1">Upload Banner</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setStoreBanner)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Social Media Handles
            </h3>

            <div className="space-y-3">
              {socialAccounts.map((account) => {
                const platformInfo = getPlatformInfo(account.platform);
                return (
                  <div key={account.id} className="flex items-center gap-3">
                    <div className={`w-32 px-3 py-3 bg-luxury-gray border border-gray-600 rounded-lg ${platformInfo.color} text-sm font-medium flex items-center gap-2`}>
                      {account.platform === "instagram" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      )}
                      {account.platform === "facebook" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      )}
                      {account.platform === "youtube" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      )}
                      {account.platform === "twitter" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      {account.platform === "linkedin" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                      {platformInfo.label}
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                      <input
                        type="text"
                        value={account.handle}
                        onChange={(e) => updateSocialAccount(account.id, e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        placeholder={account.platform === "website" ? "www.example.com" : "username"}
                      />
                    </div>
                    {socialAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialAccount(account.id)}
                        className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Social Account Button */}
              {getAvailablePlatforms().length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddSocialDropdown(!showAddSocialDropdown)}
                    className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-luxury-gold transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Social Account
                  </button>

                  {showAddSocialDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-luxury-dark border border-luxury-gray rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {getAvailablePlatforms().map((platform) => (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => addSocialAccount(platform.value)}
                          className={`w-full px-4 py-3 text-left hover:bg-luxury-gray transition-colors flex items-center gap-3 ${platform.color}`}
                        >
                          <span className="font-medium">{platform.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error messages */}
          {(hasAvailabilityError || hasValidationErrors) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {hasAvailabilityError
                  ? "Please resolve the availability conflicts before updating"
                  : "Please fix the validation errors before updating"}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t border-luxury-gray">
            <button
              type="submit"
              disabled={submitting || hasAvailabilityError || hasValidationErrors}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating Reseller..." : "Update Reseller"}
            </button>
            <Link
              href="/admin/dashboard/resellers"
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
