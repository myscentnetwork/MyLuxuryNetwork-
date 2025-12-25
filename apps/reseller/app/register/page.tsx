"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    whatsappNumber: "",
    shopName: "",
    storeAddress: "",
    customDomain: "",
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    password: string | null;
    confirmPassword: string | null;
  }>({
    email: null,
    contactNumber: null,
    whatsappNumber: null,
    password: null,
    confirmPassword: null,
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
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
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
      const res = await fetch(`/api/check-availability?field=${field}&value=${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error("Failed to check availability");
      const data = await res.json();
      setAvailability((prev) => ({ ...prev, [field]: data.available ? "available" : "taken" }));
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailability((prev) => ({ ...prev, [field]: "idle" }));
    }
  };

  // Debounced availability checks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.shopName) checkAvailability("shopName", form.shopName);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.shopName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.email && validateEmail(form.email)) {
        checkAvailability("email", form.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.contactNumber && validateIndianPhone(form.contactNumber)) {
        checkAvailability("contactNumber", form.contactNumber);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.contactNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
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

    // Handle phone number fields
    if (name === "contactNumber" || name === "whatsappNumber") {
      const formattedValue = formatPhoneNumber(value);
      setForm((prev) => ({ ...prev, [name]: formattedValue }));
      const errorMessage = getPhoneValidationError(formattedValue);
      setValidationErrors((prev) => ({ ...prev, [name]: errorMessage }));
      if (errorMessage || !formattedValue || formattedValue.length < 10) {
        setAvailability((prev) => ({ ...prev, [name]: "idle" }));
      }
      return;
    }

    // Handle email validation
    if (name === "email") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value && !validateEmail(value)) {
        setValidationErrors((prev) => ({ ...prev, email: "Enter a valid email address" }));
        setAvailability((prev) => ({ ...prev, email: "idle" }));
      } else {
        setValidationErrors((prev) => ({ ...prev, email: null }));
      }
      return;
    }

    // Handle password validation
    if (name === "password") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value && value.length < 6) {
        setValidationErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }));
      } else {
        setValidationErrors((prev) => ({ ...prev, password: null }));
      }
      // Check confirm password match
      if (form.confirmPassword && value !== form.confirmPassword) {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: null }));
      }
      return;
    }

    // Handle confirm password validation
    if (name === "confirmPassword") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value && value !== form.password) {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setValidationErrors((prev) => ({ ...prev, confirmPassword: null }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const hasValidationError =
    validationErrors.email !== null ||
    validationErrors.contactNumber !== null ||
    validationErrors.whatsappNumber !== null ||
    validationErrors.password !== null ||
    validationErrors.confirmPassword !== null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmRegister = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);

    try {
      const instagramAccount = socialAccounts.find((s) => s.platform === "instagram" && s.handle.trim());
      const facebookAccount = socialAccounts.find((s) => s.platform === "facebook" && s.handle.trim());
      const twitterAccount = socialAccounts.find((s) => s.platform === "twitter" && s.handle.trim());
      const linkedinAccount = socialAccounts.find((s) => s.platform === "linkedin" && s.handle.trim());

      const registrationData = {
        ...form,
        contactNumber: form.contactNumber ? `+91${form.contactNumber}` : undefined,
        whatsappNumber: form.whatsappNumber ? `+91${form.whatsappNumber}` : undefined,
        storeLogo: storeLogo || undefined,
        storeBanner: storeBanner || undefined,
        instagramHandle: instagramAccount?.handle || undefined,
        facebookUrl: facebookAccount?.handle || undefined,
        xUrl: twitterAccount?.handle || undefined,
        linkedinUrl: linkedinAccount?.handle || undefined,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSubmitting(false);
      setSuccess(true);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your account is pending admin approval. You will be able to login once approved.
          </p>
          <Link
            href="/login"
            className="inline-block bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
          </Link>
          <h2 className="text-xl text-white">Become a Reseller</h2>
          <p className="text-gray-400 mt-2">Fill in your details to register as a reseller</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-8">
          {/* Account Credentials Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {validationErrors.email && (
                      <span className="text-xs text-red-400">{validationErrors.email}</span>
                    )}
                    <AvailabilityIndicator status={availability.email} />
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
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {validationErrors.password && (
                    <span className="text-xs text-red-400">{validationErrors.password}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className={`w-full px-4 py-3 pr-12 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                      validationErrors.password ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  {validationErrors.confirmPassword && (
                    <span className="text-xs text-red-400">{validationErrors.confirmPassword}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 pr-12 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                      validationErrors.confirmPassword ? "border-red-500" : form.confirmPassword && !validationErrors.confirmPassword ? "border-green-500" : "border-gray-600"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  placeholder="Enter your full name"
                />
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
                  placeholder="Enter your shop name"
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
                    <AvailabilityIndicator status={availability.contactNumber} />
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
                    <AvailabilityIndicator status={availability.whatsappNumber} />
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

              {/* Store URL Preview */}
              <div className="md:col-span-2 p-4 bg-luxury-gray/50 rounded-lg border border-gray-600">
                <p className="text-xs text-gray-500 mb-1">Your Store URL (auto-generated)</p>
                <div className="flex items-center gap-2 px-4 py-2 bg-luxury-gray rounded-lg border border-gray-700">
                  <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-luxury-gold">
                    https://myluxury.network/{form.shopName ? form.shopName.toLowerCase().replace(/\s+/g, "") : "<shopname>"}
                  </span>
                </div>
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
                  <span className="text-gray-500 text-xs ml-1">(200x200px)</span>
                </label>
                <div className="relative">
                  {storeLogo ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-luxury-gray">
                      <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setStoreLogo(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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
                  <span className="text-gray-500 text-xs ml-1">(1200x400px)</span>
                </label>
                <div className="relative">
                  {storeBanner ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-luxury-gray">
                      <img src={storeBanner} alt="Store Banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setStoreBanner(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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
              Social Media
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </h3>

            <div className="space-y-3">
              {socialAccounts.map((account) => {
                const platformInfo = getPlatformInfo(account.platform);
                return (
                  <div key={account.id} className="flex items-center gap-3">
                    <div className={`w-32 px-3 py-3 bg-luxury-gray border border-gray-600 rounded-lg ${platformInfo.color} text-sm font-medium flex items-center gap-2`}>
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
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}

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
          {hasAnyError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-1">
              {hasAvailabilityError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please resolve the availability conflicts
                </p>
              )}
              {hasValidationError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please fix the validation errors
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-luxury-gray">
            <button
              type="submit"
              disabled={submitting || hasAnyError}
              className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
            <Link
              href="/login"
              className="text-center bg-luxury-gray hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all"
            >
              Already have an account? Login
            </Link>
          </div>
        </form>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-luxury-gray">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirm Registration</h3>
                    <p className="text-gray-400 text-sm">Please review your details</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-luxury-gray/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Your Details</h4>
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
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Your Store URL</h4>
                  <p className="text-luxury-gold font-mono text-sm">
                    https://myluxury.network/{form.shopName.toLowerCase().replace(/\s+/g, "")}
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Your account will require admin approval before you can login.
                  </p>
                </div>
              </div>

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
                  onClick={confirmRegister}
                  className="px-6 py-3 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
