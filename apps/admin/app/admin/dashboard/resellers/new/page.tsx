"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
}

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: "instagram", color: "text-pink-400" },
  { value: "facebook", label: "Facebook", icon: "facebook", color: "text-blue-400" },
  { value: "youtube", label: "YouTube", icon: "youtube", color: "text-red-500" },
  { value: "twitter", label: "Twitter/X", icon: "twitter", color: "text-gray-400" },
  { value: "linkedin", label: "LinkedIn", icon: "linkedin", color: "text-blue-500" },
  { value: "tiktok", label: "TikTok", icon: "tiktok", color: "text-white" },
  { value: "pinterest", label: "Pinterest", icon: "pinterest", color: "text-red-400" },
  { value: "telegram", label: "Telegram", icon: "telegram", color: "text-blue-400" },
  { value: "threads", label: "Threads", icon: "threads", color: "text-white" },
  { value: "website", label: "Website", icon: "website", color: "text-green-400" },
];

interface Reseller {
  id: string;
  shopName: string;
  email: string;
  contactNumber: string;
  whatsappNumber: string;
  customDomain: string;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

export default function AddNewReseller() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    contactNumber: "",
    whatsappNumber: "",
    shopName: "",
    email: "",
    storeAddress: "",
    customDomain: "",
  });

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

  // Social accounts - Instagram by default
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { id: "1", platform: "instagram", handle: "" }
  ]);
  const [showAddSocialDropdown, setShowAddSocialDropdown] = useState(false);

  // Store branding images (optional)
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeBanner, setStoreBanner] = useState<string | null>(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    email: string | null;
    contactNumber: string | null;
    whatsappNumber: string | null;
  }>({
    email: null,
    contactNumber: null,
    whatsappNumber: null,
  });

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function (exactly 10 digits starting with 6-9)
  const validateIndianPhone = (phone: string): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, "");
    // Must be exactly 10 digits starting with 6-9
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
    // Remove all non-digit characters
    let cleaned = value.replace(/\D/g, "");

    // Remove leading 91 if user pastes full number
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }

    // Remove leading 0 if present
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // Limit to 10 digits
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }

    return cleaned;
  };

  // Check availability function
  const checkAvailability = async (field: keyof typeof availability, value: string) => {
    if (!value.trim()) {
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
      return;
    }

    setAvailability((prev) => ({ ...prev, [field]: "checking" }));

    try {
      const res = await fetch("/api/resellers");
      if (!res.ok) throw new Error("Failed to fetch resellers");

      const resellers: Reseller[] = await res.json();
      let isTaken = false;

      if (field === "shopName") {
        const username = value.toLowerCase().replace(/\s+/g, "");
        isTaken = resellers.some((r) => r.shopName.toLowerCase().replace(/\s+/g, "") === username);
      } else if (field === "email") {
        isTaken = resellers.some((r) => r.email.toLowerCase() === value.toLowerCase());
      } else if (field === "contactNumber") {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        isTaken = resellers.some((r) => r.contactNumber?.replace(/[\s\-\(\)\+]/g, "") === cleanNumber);
      } else if (field === "whatsappNumber") {
        const cleanNumber = value.replace(/[\s\-\(\)\+]/g, "");
        isTaken = resellers.some((r) => r.whatsappNumber?.replace(/[\s\-\(\)\+]/g, "") === cleanNumber);
      } else if (field === "customDomain") {
        isTaken = resellers.some((r) => r.customDomain?.toLowerCase() === value.toLowerCase());
      }

      setAvailability((prev) => ({ ...prev, [field]: isTaken ? "taken" : "available" }));
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
    }
  };

  // Debounced availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.shopName) checkAvailability("shopName", form.shopName);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.shopName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only check availability if email is valid
      if (form.email && validateEmail(form.email)) {
        checkAvailability("email", form.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only check availability if phone number is valid (exactly 10 digits after +91)
      if (form.contactNumber && validateIndianPhone(form.contactNumber)) {
        checkAvailability("contactNumber", form.contactNumber);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.contactNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only check availability if WhatsApp number is valid (exactly 10 digits after +91)
      if (form.whatsappNumber && validateIndianPhone(form.whatsappNumber)) {
        checkAvailability("whatsappNumber", form.whatsappNumber);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.whatsappNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.customDomain) checkAvailability("customDomain", form.customDomain);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.customDomain]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle phone number fields (only 10 digits)
    if (name === "contactNumber" || name === "whatsappNumber") {
      const formattedValue = formatPhoneNumber(value);
      setForm((prev) => ({ ...prev, [name]: formattedValue }));

      // Get validation error message
      const errorMessage = getPhoneValidationError(formattedValue);
      setValidationErrors((prev) => ({ ...prev, [name]: errorMessage }));

      // Reset availability if number is invalid or incomplete
      if (errorMessage || !formattedValue || formattedValue.length < 10) {
        setAvailability((prev) => ({ ...prev, [name]: "idle" }));
      }
      return;
    }

    // Handle email validation
    if (name === "email") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value && !validateEmail(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          email: "Enter a valid email address",
        }));
        // Reset availability if email is invalid
        setAvailability((prev) => ({ ...prev, email: "idle" }));
      } else {
        setValidationErrors((prev) => ({ ...prev, email: null }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Availability indicator component
  const AvailabilityIndicator = ({ status, field }: { status: AvailabilityStatus; field: string }) => {
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

  const hasValidationError =
    validationErrors.email !== null ||
    validationErrors.contactNumber !== null ||
    validationErrors.whatsappNumber !== null;

  const hasAvailabilityError =
    availability.shopName === "taken" ||
    availability.email === "taken" ||
    availability.contactNumber === "taken";

  const hasAnyError = hasAvailabilityError || hasValidationError;

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

  // Get platform info
  const getPlatformInfo = (platform: string) => {
    return SOCIAL_PLATFORMS.find((p) => p.value === platform) || { label: platform, color: "text-gray-400" };
  };

  // Get available platforms (not already added)
  const getAvailablePlatforms = () => {
    const usedPlatforms = socialAccounts.map((s) => s.platform);
    return SOCIAL_PLATFORMS.filter((p) => !usedPlatforms.includes(p.value));
  };

  // Image upload handlers
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
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

  // Show confirmation modal instead of directly submitting
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Actually save the reseller after confirmation
  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      // Extract Instagram handle for the instagramHandle field
      const instagramAccount = socialAccounts.find((s) => s.platform === "instagram" && s.handle.trim());
      const facebookAccount = socialAccounts.find((s) => s.platform === "facebook" && s.handle.trim());
      const twitterAccount = socialAccounts.find((s) => s.platform === "twitter" && s.handle.trim());
      const linkedinAccount = socialAccounts.find((s) => s.platform === "linkedin" && s.handle.trim());

      const newReseller = {
        ...form,
        // Prepend +91 to phone numbers before sending to API
        contactNumber: form.contactNumber ? `+91${form.contactNumber}` : undefined,
        whatsappNumber: form.whatsappNumber ? `+91${form.whatsappNumber}` : undefined,
        storeLogo: storeLogo || undefined,
        storeBanner: storeBanner || undefined,
        // Map social accounts to API fields
        instagramHandle: instagramAccount?.handle || undefined,
        facebookUrl: facebookAccount?.handle || undefined,
        xUrl: twitterAccount?.handle || undefined,
        linkedinUrl: linkedinAccount?.handle || undefined,
        status: "inactive", // Default inactive until first order
      };

      const res = await fetch("/api/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReseller),
      });

      if (!res.ok) {
        throw new Error("Failed to create reseller");
      }

      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/dashboard/resellers");
      }, 1500);
    } catch (error) {
      setSubmitting(false);
      alert("Failed to create reseller. Please try again.");
    }
  };

  return (
    <AdminLayout
      title="Add New Reseller"
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
          Reseller added successfully! Redirecting to list...
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
                  <div className="flex items-center gap-2">
                    {validationErrors.email && (
                      <span className="text-xs text-red-400">{validationErrors.email}</span>
                    )}
                    <AvailabilityIndicator status={availability.email} field="email" />
                  </div>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                    validationErrors.email ? "border-red-500" : availability.email === "taken" ? "border-red-500" : availability.email === "available" ? "border-green-500" : "border-gray-600"
                  }`}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-300">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {validationErrors.contactNumber && (
                      <span className="text-xs text-red-400">{validationErrors.contactNumber}</span>
                    )}
                    <AvailabilityIndicator status={availability.contactNumber} field="contactNumber" />
                  </div>
                </div>
                <div className={`flex items-center bg-luxury-gray border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-luxury-gold focus-within:border-transparent ${
                  validationErrors.contactNumber ? "border-red-500" : availability.contactNumber === "taken" ? "border-red-500" : availability.contactNumber === "available" ? "border-green-500" : "border-gray-600"
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
                  <div className="flex items-center gap-2">
                    {validationErrors.whatsappNumber && (
                      <span className="text-xs text-red-400">{validationErrors.whatsappNumber}</span>
                    )}
                    <AvailabilityIndicator status={availability.whatsappNumber} field="whatsappNumber" />
                  </div>
                </div>
                <div className={`flex items-center bg-luxury-gray border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-luxury-gold focus-within:border-transparent ${
                  validationErrors.whatsappNumber ? "border-red-500" : availability.whatsappNumber === "taken" ? "border-red-500" : availability.whatsappNumber === "available" ? "border-green-500" : "border-gray-600"
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
                  <AvailabilityIndicator status={availability.shopName} field="shopName" />
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
                    <AvailabilityIndicator status={availability.customDomain} field="customDomain" />
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
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Logo
                  <span className="text-gray-500 text-xs ml-1">(Recommended: 200x200px)</span>
                </label>
                <div className="relative">
                  {storeLogo ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-luxury-gray">
                      <img
                        src={storeLogo}
                        alt="Store Logo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStoreLogo(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="Remove logo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors bg-luxury-gray/30">
                      <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs text-gray-500">Upload Logo</span>
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
                  <span className="text-gray-500 text-xs ml-1">(Recommended: 1200x400px)</span>
                </label>
                <div className="relative">
                  {storeBanner ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-luxury-gray">
                      <img
                        src={storeBanner}
                        alt="Store Banner"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStoreBanner(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="Remove banner"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-luxury-gold transition-colors bg-luxury-gray/30">
                      <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500">Upload Banner</span>
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

          {/* Submit Button */}
          {/* Error messages */}
          {hasAnyError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-1">
              {hasAvailabilityError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please resolve the availability conflicts before submitting
                </p>
              )}
              {hasValidationError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please fix the validation errors before submitting
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-luxury-gray">
            <button
              type="submit"
              disabled={submitting || hasAnyError}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding Reseller..." : "Add Reseller"}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-luxury-gray">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm New Reseller</h3>
                  <p className="text-gray-400 text-sm">Please review the details before saving</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="bg-luxury-gray/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="text-white font-medium">{form.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Shop Name:</span>
                    <p className="text-white font-medium">{form.shopName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="text-white font-medium">{form.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <p className="text-white font-medium">+91 {form.contactNumber}</p>
                  </div>
                  {form.whatsappNumber && (
                    <div>
                      <span className="text-gray-500">WhatsApp:</span>
                      <p className="text-white font-medium">+91 {form.whatsappNumber}</p>
                    </div>
                  )}
                  {form.customDomain && (
                    <div>
                      <span className="text-gray-500">Custom Domain:</span>
                      <p className="text-luxury-gold font-medium">{form.customDomain}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Store Address */}
              <div className="bg-luxury-gray/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Store Address</h4>
                <p className="text-white text-sm">{form.storeAddress}</p>
              </div>

              {/* Store URL */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Store URL</h4>
                <p className="text-luxury-gold font-mono text-sm">
                  https://myluxury.network/{form.shopName.toLowerCase().replace(/\s+/g, "")}
                </p>
              </div>

              {/* Store Branding */}
              {(storeLogo || storeBanner) && (
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Store Branding</h4>
                  <div className="flex flex-wrap gap-4">
                    {storeLogo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Logo</p>
                        <img src={storeLogo} alt="Store Logo" className="w-16 h-16 rounded-lg object-cover border border-luxury-gray" />
                      </div>
                    )}
                    {storeBanner && (
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-1">Banner</p>
                        <img src={storeBanner} alt="Store Banner" className="w-full h-16 rounded-lg object-cover border border-luxury-gray" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media Summary */}
              {socialAccounts.some(s => s.handle.trim()) && (
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialAccounts.filter(s => s.handle.trim()).map((s) => {
                      const platformInfo = getPlatformInfo(s.platform);
                      return (
                        <span key={s.id} className={`px-2 py-1 bg-opacity-20 rounded text-xs ${platformInfo.color}`} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          {platformInfo.label}: @{s.handle}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-luxury-gray flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-3 bg-luxury-gray hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSave}
                className="px-6 py-3 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
