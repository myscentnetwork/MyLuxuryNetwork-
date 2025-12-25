"use client";

import { useState, useEffect, useCallback } from "react";

interface BusinessStats {
  totalBusiness: number;
  paidBusiness: number;
  orderCount: number;
}

interface BusinessTotals {
  wholesaler: BusinessStats;
  reseller: BusinessStats;
  retail: BusinessStats;
  grandTotal: number;
}

export function useBusinessTotals() {
  const [totals, setTotals] = useState<BusinessTotals>({
    wholesaler: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    reseller: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    retail: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats/business-totals");
      if (!res.ok) throw new Error("Failed to fetch business totals");
      const data = await res.json();
      setTotals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  return {
    totals,
    loading,
    error,
    refetch: fetchTotals,
  };
}
