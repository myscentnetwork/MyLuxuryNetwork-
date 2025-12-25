"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import { useWholesalers } from "@/src/hooks/entities";

interface ValidationState {
  checking: boolean;
  available: boolean | null;
  message: string;
}

export default function NewWholesaler() {
  const router = useRouter();
  const { createWholesaler } = useWholesalers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    companyName: string;
    contactNumber: string;
    whatsappNumber: string;
    email: string;
    address: string;
    city: string;
    status: "active" | "inactive";
    instagramHandle: string;
    facebookUrl: string;
    xUrl: string;
    linkedinUrl: string;
  }>({
    name: "",
    companyName: "",
    contactNumber: "",
    whatsappNumber: "",
    email: "",
    address: "",
    city: "",
    status: "inactive",
    instagramHandle: "",
    facebookUrl: "",
    xUrl: "",
    linkedinUrl: "",
  });

  // Validation states
  const [emailValidation, setEmailValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });
  const [whatsappValidation, setWhatsappValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });
  const [companyValidation, setCompanyValidation] = useState<ValidationState>({
    checking: false,
    available: null,
    message: "",
  });

  // Check availability helper
  const checkAvailability = async (
    field: string,
    value: string,
    setValidation: React.Dispatch<React.SetStateAction<ValidationState>>
  ) => {
    if (!value.trim()) {
      setValidation({ checking: false, available: null, message: "" });
      return;
    }

    setValidation({ checking: true, available: null, message: "" });

    try {
      const res = await fetch(
        `/api/wholesalers/check-availability?field=${field}&value=${encodeURIComponent(value)}`
      );
      const data = await res.json();

      if (data.available) {
        setValidation({ checking: false, available: true, message: "Available" });
      } else {
        const fieldLabels: Record<string, string> = {
          email: "Email",
          contactNumber: "Contact number",
          whatsappNumber: "WhatsApp number",
          gstNumber: "GST number",
          companyName: "Company name",
        };
        setValidation({
          checking: false,
          available: false,
          message: `${fieldLabels[field] || field} already exists`,
        });
      }
    } catch {
      setValidation({ checking: false, available: null, message: "" });
    }
  };

  // Debounced validation for email
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkAvailability("email", formData.email, setEmailValidation);
      } else {
        setEmailValidation({ checking: false, available: null, message: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Debounced validation for contact number
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.contactNumber) {
        checkAvailability("contactNumber", formData.contactNumber, setContactValidation);
      } else {
        setContactValidation({ checking: false, available: null, message: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.contactNumber]);

  // Debounced validation for WhatsApp number
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.whatsappNumber) {
        checkAvailability("whatsappNumber", formData.whatsappNumber, setWhatsappValidation);
      } else {
        setWhatsappValidation({ checking: false, available: null, message: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.whatsappNumber]);

  // Debounced validation for company name (exact match)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.companyName) {
        checkAvailability("companyName", formData.companyName, setCompanyValidation);
      } else {
        setCompanyValidation({ checking: false, available: null, message: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.companyName]);

  // Check if form has validation errors
  const hasValidationErrors =
    emailValidation.available === false ||
    contactValidation.available === false ||
    whatsappValidation.available === false ||
    companyValidation.available === false;

  const isValidating =
    emailValidation.checking ||
    contactValidation.checking ||
    whatsappValidation.checking ||
    companyValidation.checking;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasValidationErrors) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createWholesaler(formData);
      router.push("/admin/dashboard/wholesalers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wholesaler");
    } finally {
      setLoading(false);
    }
  };

  // Validation indicator component
  const ValidationIndicator = ({ validation }: { validation: ValidationState }) => {
    if (validation.checking) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-luxury-gold"></div>
        </div>
      );
    }
    if (validation.available === true) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (validation.available === false) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return null;
  };

  // Get input border class based on validation
  const getInputClass = (validation: ValidationState) => {
    const baseClass = "w-full px-4 py-3 pr-10 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2";
    if (validation.available === false) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }
    if (validation.available === true) {
      return `${baseClass} border-green-500 focus:ring-green-500`;
    }
    return `${baseClass} border-gray-600 focus:ring-luxury-gold`;
  };

  return (
    <AdminLayout title="Add New Wholesaler">
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={getInputClass(companyValidation)}
                    placeholder="ABC Traders Pvt Ltd"
                  />
                  <ValidationIndicator validation={companyValidation} />
                </div>
                {companyValidation.available === false && (
                  <p className="mt-1 text-sm text-red-400">{companyValidation.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={getInputClass(emailValidation)}
                    placeholder="contact@company.com"
                  />
                  <ValidationIndicator validation={emailValidation} />
                </div>
                {emailValidation.available === false && (
                  <p className="mt-1 text-sm text-red-400">{emailValidation.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className={getInputClass(contactValidation)}
                    placeholder="+91 98765 43210"
                  />
                  <ValidationIndicator validation={contactValidation} />
                </div>
                {contactValidation.available === false && (
                  <p className="mt-1 text-sm text-red-400">{contactValidation.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className={getInputClass(whatsappValidation)}
                    placeholder="+91 98765 43210"
                  />
                  <ValidationIndicator validation={whatsappValidation} />
                </div>
                {whatsappValidation.available === false && (
                  <p className="mt-1 text-sm text-red-400">{whatsappValidation.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="Full business address"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Social Links (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  X (Twitter) URL
                </label>
                <input
                  type="url"
                  value={formData.xUrl}
                  onChange={(e) => setFormData({ ...formData, xUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="https://x.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  placeholder="https://linkedin.com/..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || hasValidationErrors || isValidating}
              className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : isValidating ? "Validating..." : "Create Wholesaler"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-luxury-gray text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
