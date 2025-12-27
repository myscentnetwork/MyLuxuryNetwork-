"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password visibility
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
    userType: "reseller" as "wholesaler" | "reseller" | "retailer",
  });

  // Validation state
  const [validating, setValidating] = useState({ email: false, phone: false });
  const [fieldErrors, setFieldErrors] = useState({ email: "", contactNumber: "" });

  // Get API endpoint based on user type
  const getApiEndpoint = (userType: string) => {
    switch (userType) {
      case "wholesaler": return "/api/wholesalers";
      case "retailer": return "/api/retailers";
      default: return "/api/resellers";
    }
  };

  // Debounced validation for email
  useEffect(() => {
    if (!signUpData.email) {
      setFieldErrors(prev => ({ ...prev, email: "" }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpData.email)) {
      setFieldErrors(prev => ({ ...prev, email: "Invalid email format" }));
      return;
    }

    const timer = setTimeout(async () => {
      setValidating(prev => ({ ...prev, email: true }));
      try {
        const endpoint = getApiEndpoint(signUpData.userType);
        const res = await fetch(`${endpoint}/check-availability?email=${encodeURIComponent(signUpData.email)}`);
        const data = await res.json();
        if (!data.email) {
          setFieldErrors(prev => ({ ...prev, email: "Email is already registered" }));
        } else {
          setFieldErrors(prev => ({ ...prev, email: "" }));
        }
      } catch {
        // Ignore errors
      } finally {
        setValidating(prev => ({ ...prev, email: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [signUpData.email, signUpData.userType]);

  // Debounced validation for phone
  useEffect(() => {
    if (!signUpData.contactNumber) {
      setFieldErrors(prev => ({ ...prev, contactNumber: "" }));
      return;
    }

    const timer = setTimeout(async () => {
      setValidating(prev => ({ ...prev, phone: true }));
      try {
        const endpoint = getApiEndpoint(signUpData.userType);
        const res = await fetch(`${endpoint}/check-availability?contactNumber=${encodeURIComponent(signUpData.contactNumber)}`);
        const data = await res.json();
        if (!data.contactNumber) {
          setFieldErrors(prev => ({ ...prev, contactNumber: "Phone number is already registered" }));
        } else {
          setFieldErrors(prev => ({ ...prev, contactNumber: "" }));
        }
      } catch {
        // Ignore errors
      } finally {
        setValidating(prev => ({ ...prev, phone: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [signUpData.contactNumber, signUpData.userType]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: signInEmail, password: signInPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      if (data.success && data.user) {
        // Set cookies for portal authentication
        document.cookie = `user_type=${data.user.type}; path=/; max-age=604800`; // 7 days
        document.cookie = `user_id=${data.user.id}; path=/; max-age=604800`;
        document.cookie = `user_name=${encodeURIComponent(data.user.name)}; path=/; max-age=604800`;
        document.cookie = `user_username=${encodeURIComponent(data.user.username || "")}; path=/; max-age=604800`;

        // Redirect to portal dashboard
        window.location.href = "/portal/dashboard";
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check for field errors
    if (fieldErrors.email || fieldErrors.contactNumber) {
      setError("Please fix the errors before submitting");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const endpoint = getApiEndpoint(signUpData.userType);
      const res = await fetch(`${endpoint}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          contactNumber: signUpData.contactNumber,
          password: signUpData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const userTypeLabel = signUpData.userType === "wholesaler" ? "Wholesaler" :
                           signUpData.userType === "retailer" ? "Customer" : "Reseller";
      setSuccess(`${userTypeLabel} registration successful! Please wait for admin approval.`);
      setSignUpData({
        name: "",
        email: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
        userType: "reseller",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tab: "signin" | "signup") => {
    setModalTab(tab);
    setShowModal(true);
    setError("");
    setSuccess("");
    setFieldErrors({ email: "", contactNumber: "" });
  };

  // Eye icon for show password
  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  // Eye-off icon for hide password
  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-luxury-black/80 backdrop-blur-md border-b border-luxury-gray/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => openModal("signin")}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openModal("signup")}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-5 py-2 rounded-lg transition-all"
            >
              Join Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Your Luxury <span className="text-luxury-gold">Marketplace</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join our network of premium resellers. Get your own branded store and start selling luxury products today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openModal("signup")}
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-8 py-4 rounded-lg text-lg transition-all"
            >
              Start Selling
            </button>
            <button
              onClick={() => openModal("signin")}
              className="border border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10 font-semibold px-8 py-4 rounded-lg text-lg transition-all"
            >
              Login to Your Account
            </button>
          </div>

          {/* User type badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm">
              Wholesalers
            </span>
            <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm">
              Resellers
            </span>
            <span className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm">
              Customers
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-luxury-dark/50">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-white text-center mb-12">Why Join Us?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-luxury-gray/30 p-6 rounded-xl border border-luxury-gray/50">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Your Own Store</h4>
              <p className="text-gray-400">Get a personalized storefront with your branding at myluxury.network/yourstore</p>
            </div>
            <div className="bg-luxury-gray/30 p-6 rounded-xl border border-luxury-gray/50">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Premium Products</h4>
              <p className="text-gray-400">Access our curated catalog of luxury items ready to sell to your customers</p>
            </div>
            <div className="bg-luxury-gray/30 p-6 rounded-xl border border-luxury-gray/50">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Earn Commission</h4>
              <p className="text-gray-400">Set your own margins and keep the profits from every sale you make</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-luxury-gray/30">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2025 MyLuxuryNetwork. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => openModal("signin")}
              className="text-gray-500 hover:text-luxury-gold text-sm transition-colors"
            >
              User Login
            </button>
            <Link href="/admin/login" className="text-gray-500 hover:text-gray-300 text-sm">
              Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-luxury-dark border border-luxury-gray rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-luxury-dark border-b border-luxury-gray p-4 flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={() => { setModalTab("signin"); setError(""); setSuccess(""); }}
                  className={`text-lg font-semibold transition-colors ${
                    modalTab === "signin" ? "text-luxury-gold" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setModalTab("signup"); setError(""); setSuccess(""); }}
                  className={`text-lg font-semibold transition-colors ${
                    modalTab === "signup" ? "text-luxury-gold" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Sign Up
                </button>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {modalTab === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Welcome Back</h3>
                    <p className="text-gray-400 text-sm mb-4">Sign in to access your dashboard</p>
                    <div className="flex justify-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400">Wholesaler</span>
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400">Reseller</span>
                      <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400">Customer</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email or Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full px-4 py-3 pl-11 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-all"
                        placeholder="Enter your email or username"
                        required
                        autoComplete="username"
                      />
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showSignInPassword ? "text" : "password"}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-11 pr-12 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-all"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showSignInPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                  <p className="text-center text-gray-500 text-sm">
                    <button
                      type="button"
                      onClick={() => alert("Please contact admin to reset your password")}
                      className="text-luxury-gold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </p>
                  <div className="text-center pt-4 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => { setModalTab("signup"); setError(""); setSuccess(""); }}
                        className="text-luxury-gold hover:underline font-medium"
                      >
                        Sign up now
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* User Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I am a *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignUpData({ ...signUpData, userType: "wholesaler" })}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          signUpData.userType === "wholesaler"
                            ? "bg-blue-500/20 border-blue-500 text-blue-400"
                            : "bg-luxury-gray border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        Wholesaler
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpData({ ...signUpData, userType: "reseller" })}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          signUpData.userType === "reseller"
                            ? "bg-green-500/20 border-green-500 text-green-400"
                            : "bg-luxury-gray border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        Reseller
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpData({ ...signUpData, userType: "retailer" })}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          signUpData.userType === "retailer"
                            ? "bg-orange-500/20 border-orange-500 text-orange-400"
                            : "bg-luxury-gray border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        Customer
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                          fieldErrors.email ? "border-red-500" : "border-gray-600"
                        }`}
                        placeholder="your@email.com"
                        required
                      />
                      {validating.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!validating.email && signUpData.email && !fieldErrors.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={signUpData.contactNumber}
                        onChange={(e) => setSignUpData({ ...signUpData, contactNumber: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                          fieldErrors.contactNumber ? "border-red-500" : "border-gray-600"
                        }`}
                        placeholder="+1 234 567 8900"
                        required
                      />
                      {validating.phone && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!validating.phone && signUpData.contactNumber && !fieldErrors.contactNumber && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {fieldErrors.contactNumber && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.contactNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-3 pr-12 bg-luxury-gray border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent ${
                          signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword
                            ? "border-red-500"
                            : "border-gray-600"
                        }`}
                        placeholder="Confirm password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !!fieldErrors.email || !!fieldErrors.contactNumber || validating.email || validating.phone}
                    className="w-full bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                  <p className="text-center text-gray-500 text-xs">
                    By signing up, you agree to our Terms of Service
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
