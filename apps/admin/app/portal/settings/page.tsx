"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import PortalLayout, { UserType } from "@/src/components/layouts/PortalLayout";
import {
  FaStore,
  FaLink,
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTelegram,
  FaSave,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaCamera,
  FaTrash,
  FaImage,
} from "react-icons/fa";

interface UserSettings {
  id: string;
  name: string;
  email: string;
  username: string | null;
  shopName?: string;
  companyName?: string;
  contactNumber: string | null;
  whatsappNumber: string | null;
  storeAddress?: string;
  address?: string;
  city?: string;
  storeLogo?: string | null;
  storeBanner?: string | null;
  tagline?: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  youtubeHandle: string | null;
  telegramHandle: string | null;
}

export default function PortalSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    shopName: "",
    companyName: "",
    contactNumber: "",
    whatsappNumber: "",
    storeAddress: "",
    address: "",
    city: "",
    storeLogo: "",
    storeBanner: "",
    tagline: "",
    instagramHandle: "",
    facebookHandle: "",
    youtubeHandle: "",
    telegramHandle: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [originalUsername, setOriginalUsername] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Validation functions
  const validatePhone = (phone: string) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    return /^\d{10,12}$/.test(cleaned);
  };

  const validateUsername = (username: string) => {
    return username.length >= 3 && /^[a-z0-9]+$/.test(username);
  };

  const validateShopName = (name: string) => {
    return name.trim().length >= 2;
  };

  const validateSocialHandle = (handle: string) => {
    if (!handle) return null; // Optional field
    return /^[a-zA-Z0-9_.]+$/.test(handle);
  };

  const validateTagline = (tagline: string) => {
    if (!tagline) return null; // Optional field
    return tagline.trim().length >= 3;
  };

  const validateCity = (city: string) => {
    if (!city) return null; // Optional field
    return city.trim().length >= 2;
  };

  const validateAddress = (address: string) => {
    if (!address) return null; // Optional field
    return address.trim().length >= 5;
  };

  // Validation indicator component
  const ValidationIcon = ({ isValid }: { isValid: boolean | null }) => {
    if (isValid === null) return null;
    return isValid ? (
      <FaCheck className="w-4 h-4 text-green-500" />
    ) : (
      <FaTimes className="w-4 h-4 text-red-500" />
    );
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/portal/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.user);
        setUserType(data.userType);
        setOriginalUsername(data.user.username || "");
        setFormData({
          username: data.user.username || "",
          shopName: data.user.shopName || "",
          companyName: data.user.companyName || "",
          contactNumber: data.user.contactNumber || "",
          whatsappNumber: data.user.whatsappNumber || "",
          storeAddress: data.user.storeAddress || "",
          address: data.user.address || "",
          city: data.user.city || "",
          storeLogo: data.user.storeLogo || "",
          storeBanner: data.user.storeBanner || "",
          tagline: data.user.tagline || "",
          instagramHandle: data.user.instagramHandle || "",
          facebookHandle: data.user.facebookHandle || "",
          youtubeHandle: data.user.youtubeHandle || "",
          telegramHandle: data.user.telegramHandle || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
    setLoading(false);
  };

  // Check slug availability
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    // If it's the same as original username, it's available (user's own)
    if (slug === originalUsername) {
      setSlugStatus("available");
      return;
    }

    setSlugStatus("checking");

    try {
      const res = await fetch(`/api/portal/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSlugStatus(data.available ? "available" : "taken");
    } catch (error) {
      console.error("Failed to check slug:", error);
      setSlugStatus("idle");
    }
  }, [originalUsername]);

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkSlugAvailability(formData.username);
      } else {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkSlugAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (slugStatus === "taken") {
      setMessage({ type: "error", text: "This store URL is already taken. Please choose another." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/portal/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setSettings(data.user);
        setOriginalUsername(data.user.username || "");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    }
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clean slug input
    if (name === "username") {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 30);
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getStoreUrl = () => {
    if (!formData.username) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/${formData.username}`;
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(getStoreUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    setMessage(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: base64,
              folder: "store-branding",
            }),
          });

          const data = await res.json();

          if (res.ok && data.secure_url) {
            setFormData((prev) => ({
              ...prev,
              [type === "logo" ? "storeLogo" : "storeBanner"]: data.secure_url,
            }));
            setMessage({ type: "success", text: `${type === "logo" ? "Logo" : "Banner"} uploaded successfully!` });
          } else {
            setMessage({ type: "error", text: data.error || "Failed to upload image" });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Failed to upload image" });
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setMessage({ type: "error", text: "Failed to read file" });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to process image" });
      setUploading(false);
    }
  };

  const removeImage = (type: "logo" | "banner") => {
    setFormData((prev) => ({
      ...prev,
      [type === "logo" ? "storeLogo" : "storeBanner"]: "",
    }));
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Store Settings</h1>
          <p className="text-neutral-400">
            Customize your store URL and profile information
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store URL Section */}
          <div className="bg-luxury-card rounded-xl border border-luxury-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FaLink className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Store URL</h2>
                <p className="text-sm text-neutral-400">Your unique store link</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Store URL Slug
                </label>
                <div className="flex items-center bg-luxury-darker rounded-lg border border-luxury-border overflow-hidden">
                  <span className="px-4 py-3 text-neutral-500 bg-luxury-gray/50 border-r border-luxury-border whitespace-nowrap">
                    {typeof window !== "undefined" ? window.location.origin : ""}/
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="mystorename"
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <div className="px-4">
                    {slugStatus === "checking" && (
                      <FaSpinner className="w-5 h-5 text-neutral-400 animate-spin" />
                    )}
                    {slugStatus === "available" && (
                      <FaCheck className="w-5 h-5 text-green-500" />
                    )}
                    {slugStatus === "taken" && (
                      <FaTimes className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-neutral-500">
                    Only lowercase letters and numbers. Minimum 3 characters.
                  </p>
                  {slugStatus === "available" && formData.username.length >= 3 && (
                    <span className="text-xs text-green-500">Available!</span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-xs text-red-500">Already taken</span>
                  )}
                </div>
              </div>

              {formData.username && formData.username.length >= 3 && (
                <div className="flex items-center gap-3 p-4 bg-luxury-darker rounded-lg border border-luxury-border">
                  <span className="text-sm text-neutral-400">Your store URL:</span>
                  <a
                    href={getStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:text-amber-400 flex items-center gap-2"
                  >
                    {getStoreUrl()}
                    <FaExternalLinkAlt className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={copyStoreUrl}
                    className="ml-auto p-2 bg-luxury-gray rounded-lg hover:bg-luxury-border transition-colors"
                  >
                    {copied ? (
                      <FaCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FaCopy className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-luxury-card rounded-xl border border-luxury-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FaStore className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Store Information</h2>
                <p className="text-sm text-neutral-400">Basic details about your store</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {userType === "wholesaler" ? "Company Name" : "Shop Name"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name={userType === "wholesaler" ? "companyName" : "shopName"}
                    value={userType === "wholesaler" ? formData.companyName : formData.shopName}
                    onChange={handleChange}
                    placeholder={userType === "wholesaler" ? "My Company Ltd" : "My Luxury Store"}
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={validateShopName(userType === "wholesaler" ? formData.companyName : formData.shopName)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Tagline
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="Your store's tagline or slogan"
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={validateTagline(formData.tagline)} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Displayed under your store name (optional)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={formData.contactNumber ? validatePhone(formData.contactNumber) : null} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <FaWhatsapp className="w-4 h-4 inline mr-2 text-green-500" />
                  WhatsApp Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={formData.whatsappNumber ? validatePhone(formData.whatsappNumber) : null} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Customers will contact you on this number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  City
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={validateCity(formData.city)} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Address
                </label>
                <div className="relative">
                  <textarea
                    name={userType === "reseller" ? "storeAddress" : "address"}
                    value={userType === "reseller" ? formData.storeAddress : formData.address}
                    onChange={handleChange}
                    placeholder="Your store/business address"
                    rows={2}
                    className="w-full px-4 py-3 pr-10 bg-luxury-darker text-white placeholder-neutral-500 rounded-lg border border-luxury-border focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="absolute right-3 top-3">
                    <ValidationIcon isValid={validateAddress(userType === "reseller" ? formData.storeAddress : formData.address)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-luxury-card rounded-xl border border-luxury-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FaInstagram className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Social Links</h2>
                <p className="text-sm text-neutral-400">Connect your social media profiles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <FaInstagram className="w-4 h-4 inline mr-2 text-pink-500" />
                  Instagram
                </label>
                <div className="flex items-center bg-luxury-darker rounded-lg border border-luxury-border overflow-hidden">
                  <span className="px-4 py-3 text-neutral-500 bg-luxury-gray/50 border-r border-luxury-border">
                    @
                  </span>
                  <input
                    type="text"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleChange}
                    placeholder="yourhandle"
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <div className="px-3">
                    <ValidationIcon isValid={validateSocialHandle(formData.instagramHandle)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <FaFacebookF className="w-4 h-4 inline mr-2 text-blue-500" />
                  Facebook
                </label>
                <div className="flex items-center bg-luxury-darker rounded-lg border border-luxury-border overflow-hidden">
                  <span className="px-4 py-3 text-neutral-500 bg-luxury-gray/50 border-r border-luxury-border">
                    @
                  </span>
                  <input
                    type="text"
                    name="facebookHandle"
                    value={formData.facebookHandle}
                    onChange={handleChange}
                    placeholder="yourpage"
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <div className="px-3">
                    <ValidationIcon isValid={validateSocialHandle(formData.facebookHandle)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <FaYoutube className="w-4 h-4 inline mr-2 text-red-500" />
                  YouTube
                </label>
                <div className="flex items-center bg-luxury-darker rounded-lg border border-luxury-border overflow-hidden">
                  <span className="px-4 py-3 text-neutral-500 bg-luxury-gray/50 border-r border-luxury-border">
                    @
                  </span>
                  <input
                    type="text"
                    name="youtubeHandle"
                    value={formData.youtubeHandle}
                    onChange={handleChange}
                    placeholder="yourchannel"
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <div className="px-3">
                    <ValidationIcon isValid={validateSocialHandle(formData.youtubeHandle)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <FaTelegram className="w-4 h-4 inline mr-2 text-sky-400" />
                  Telegram
                </label>
                <div className="flex items-center bg-luxury-darker rounded-lg border border-luxury-border overflow-hidden">
                  <span className="px-4 py-3 text-neutral-500 bg-luxury-gray/50 border-r border-luxury-border">
                    @
                  </span>
                  <input
                    type="text"
                    name="telegramHandle"
                    value={formData.telegramHandle}
                    onChange={handleChange}
                    placeholder="yourhandle"
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <div className="px-3">
                    <ValidationIcon isValid={validateSocialHandle(formData.telegramHandle)} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Store Branding */}
          <div className="bg-luxury-card rounded-xl border border-luxury-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FaImage className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Store Branding</h2>
                <p className="text-sm text-neutral-400">Upload your logo and banner images</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Logo */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Store Logo
                </label>
                <div className="relative">
                  {formData.storeLogo ? (
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-luxury-darker border-2 border-luxury-border">
                        {formData.storeLogo.startsWith("data:") ? (
                          <img
                            src={formData.storeLogo}
                            alt="Store Logo"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Image
                            src={formData.storeLogo}
                            alt="Store Logo"
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 w-32 h-32 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <label className="p-2 bg-amber-500 rounded-lg cursor-pointer hover:bg-amber-600 transition-colors">
                          <FaCamera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "logo")}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeImage("logo")}
                          className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTrash className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {uploadingLogo && (
                        <div className="absolute inset-0 w-32 h-32 bg-black/70 rounded-xl flex items-center justify-center">
                          <FaSpinner className="w-6 h-6 text-amber-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-luxury-border bg-luxury-darker cursor-pointer hover:border-amber-500 hover:bg-luxury-gray/30 transition-all">
                      {uploadingLogo ? (
                        <FaSpinner className="w-8 h-8 text-amber-500 animate-spin" />
                      ) : (
                        <>
                          <FaCamera className="w-8 h-8 text-neutral-500 mb-2" />
                          <span className="text-xs text-neutral-500">Upload Logo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "logo")}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Recommended: 200x200px, Max 5MB
                </p>
              </div>

              {/* Store Banner */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Store Banner
                </label>
                <div className="relative">
                  {formData.storeBanner ? (
                    <div className="relative group">
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-luxury-darker border-2 border-luxury-border">
                        {formData.storeBanner.startsWith("data:") ? (
                          <img
                            src={formData.storeBanner}
                            alt="Store Banner"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Image
                            src={formData.storeBanner}
                            alt="Store Banner"
                            width={400}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <label className="p-2 bg-amber-500 rounded-lg cursor-pointer hover:bg-amber-600 transition-colors">
                          <FaCamera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "banner")}
                            className="hidden"
                            disabled={uploadingBanner}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeImage("banner")}
                          className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTrash className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {uploadingBanner && (
                        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                          <FaSpinner className="w-6 h-6 text-amber-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-luxury-border bg-luxury-darker cursor-pointer hover:border-amber-500 hover:bg-luxury-gray/30 transition-all">
                      {uploadingBanner ? (
                        <FaSpinner className="w-8 h-8 text-amber-500 animate-spin" />
                      ) : (
                        <>
                          <FaCamera className="w-8 h-8 text-neutral-500 mb-2" />
                          <span className="text-xs text-neutral-500">Upload Banner</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "banner")}
                        className="hidden"
                        disabled={uploadingBanner}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Recommended: 1200x300px, Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || slugStatus === "taken"}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
