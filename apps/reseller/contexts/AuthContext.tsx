"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface ResellerProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  contactNumber: string;
  whatsappNumber: string | null;
  shopName: string | null;
  storeAddress: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  customDomain: string | null;
  status: string;
  categories: { id: string; name: string }[];
  productCount: number;
  storeUrl: string | null;
}

interface AuthContextType {
  reseller: ResellerProfile | null;
  loading: boolean;
  error: string | null;
  login: (emailOrPhone: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [reseller, setReseller] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setReseller(data);
        setError(null);
        return true;
      } else if (res.status === 401) {
        setReseller(null);
        return false;
      }
      return false;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setReseller(null);
      return false;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    };
    checkAuth();
  }, [fetchProfile]);

  const login = async (emailOrPhone: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReseller(data.reseller);
        return true;
      } else {
        setError(data.error || "Login failed");
        return false;
      }
    } catch (err) {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setReseller(null);
      router.push("/login");
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        reseller,
        loading,
        error,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!reseller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
