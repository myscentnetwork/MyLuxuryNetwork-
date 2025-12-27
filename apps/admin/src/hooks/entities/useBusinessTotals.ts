"use client";

import { useState, useEffect, useCallback } from "react";

interface BusinessStats {
  totalBusiness: number;
  paidBusiness: number;
  orderCount: number;
}

interface InvestmentStats {
  total: number;
  paid: number;
  pending: number;
  billCount: number;
}

interface StockStats {
  costValue: number;
  retailValue: number;
  quantity: number;
  potentialProfit: number;
}

interface BusinessTotals {
  wholesaler: BusinessStats;
  reseller: BusinessStats;
  retail: BusinessStats;
  grandTotal: number;
  investment: InvestmentStats;
  stock: StockStats;
  totalSales: number;
}

export function useBusinessTotals() {
  const [totals, setTotals] = useState<BusinessTotals>({
    wholesaler: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    reseller: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    retail: { totalBusiness: 0, paidBusiness: 0, orderCount: 0 },
    grandTotal: 0,
    investment: { total: 0, paid: 0, pending: 0, billCount: 0 },
    stock: { costValue: 0, retailValue: 0, quantity: 0, potentialProfit: 0 },
    totalSales: 0,
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
