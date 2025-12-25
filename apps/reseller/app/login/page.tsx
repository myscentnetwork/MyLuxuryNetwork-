"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ResellerLogin() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, refreshProfile } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Determine if input is email or phone
      const isEmail = emailOrPhone.includes("@");
      const authData: { email?: string; phone?: string; password?: string } = {};

      if (isEmail) {
        authData.email = emailOrPhone;
      } else {
        // Clean phone number
        let phone = emailOrPhone.replace(/\D/g, "");
        if (phone.startsWith("91") && phone.length > 10) {
          phone = phone.substring(2);
        }
        authData.phone = phone.length === 10 ? `+91${phone}` : emailOrPhone;
      }

      if (password) {
        authData.password = password;
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if password is required
        if (data.requiresPassword) {
          setRequiresPassword(true);
          setError("This account requires a password.");
        } else {
          setError(data.error || "Login failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Refresh profile - the useEffect will handle redirect when isAuthenticated becomes true
      await refreshProfile();
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-black p-4">
      <div className="bg-luxury-dark p-8 rounded-2xl shadow-2xl w-full max-w-md border border-luxury-gray">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-luxury-gold">MyLuxuryNetwork</h1>
          </Link>
          <p className="text-gray-400 mt-2">Reseller Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-300 mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              id="emailOrPhone"
              value={emailOrPhone}
              onChange={(e) => {
                setEmailOrPhone(e.target.value);
                setRequiresPassword(false);
                setError("");
              }}
              className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-all"
              placeholder="Enter your email or phone"
              required
            />
          </div>

          {/* Password field - shown if account requires password */}
          <div className={requiresPassword ? "" : "hidden"}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-luxury-gold hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent transition-all"
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-luxury-gold hover:bg-yellow-600 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-luxury-gold hover:underline font-medium">
              Register as Reseller
            </Link>
          </p>
        </div>

        {/* Forgot Password Link - shown when password not required yet */}
        {!requiresPassword && (
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-gray-500 hover:text-gray-300 text-sm">
              Forgot your password?
            </Link>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-6">
          Luxury Marketplace Reseller Portal
        </p>
      </div>
    </div>
  );
}
