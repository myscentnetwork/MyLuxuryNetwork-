"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layouts/AdminLayout";

interface AutoMarkupSettings {
  wholesaleMarkupType: "percentage" | "fixed";
  wholesaleMarkupValue: number;
  resellerMarkupType: "percentage" | "fixed";
  resellerMarkupValue: number;
  retailMarkupType: "percentage" | "fixed";
  retailMarkupValue: number;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState<AutoMarkupSettings>({
    wholesaleMarkupType: "percentage",
    wholesaleMarkupValue: 0,
    resellerMarkupType: "percentage",
    resellerMarkupValue: 0,
    retailMarkupType: "percentage",
    retailMarkupValue: 0,
  });

  const [applyToExisting, setApplyToExisting] = useState(false);
  const [overrideExisting, setOverrideExisting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/auto-markup");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/auto-markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          applyToExisting,
          overrideExisting,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || "Settings saved successfully",
        });
        setApplyToExisting(false);
        setOverrideExisting(false);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save settings",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while saving",
      });
    }

    setSaving(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Example calculation
  const exampleCost = 1000;
  const calculateExample = (type: "percentage" | "fixed", value: number) => {
    if (type === "percentage") {
      return exampleCost + (exampleCost * value / 100);
    }
    return exampleCost + value;
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Auto Markup Settings */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-luxury-gray">
          <h2 className="text-lg font-semibold text-white">Auto Markup Settings</h2>
          <p className="text-gray-400 text-sm mt-1">
            Configure automatic price markups based on cost price for new products
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">How it works</p>
                <p className="text-blue-400">
                  When a new product is added with a cost price, the system will automatically calculate and set the wholesale, reseller, and retail prices based on these markup settings.
                </p>
              </div>
            </div>
          </div>

          {/* Markup Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wholesale Markup */}
            <div className="bg-luxury-gray/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="text-white font-medium">Wholesale Price Markup</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Markup Type</label>
                  <select
                    value={settings.wholesaleMarkupType}
                    onChange={(e) => setSettings({ ...settings, wholesaleMarkupType: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Markup Value {settings.wholesaleMarkupType === "percentage" ? "(%)" : "(Rs)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={settings.wholesaleMarkupType === "percentage" ? "0.1" : "1"}
                    value={settings.wholesaleMarkupValue}
                    onChange={(e) => setSettings({ ...settings, wholesaleMarkupValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>

                {settings.wholesaleMarkupValue > 0 && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
                    Example: Cost {formatPrice(exampleCost)} → <span className="text-green-400">{formatPrice(calculateExample(settings.wholesaleMarkupType, settings.wholesaleMarkupValue))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reseller Markup */}
            <div className="bg-luxury-gray/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="text-white font-medium">Reseller Price Markup</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Markup Type</label>
                  <select
                    value={settings.resellerMarkupType}
                    onChange={(e) => setSettings({ ...settings, resellerMarkupType: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Markup Value {settings.resellerMarkupType === "percentage" ? "(%)" : "(Rs)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={settings.resellerMarkupType === "percentage" ? "0.1" : "1"}
                    value={settings.resellerMarkupValue}
                    onChange={(e) => setSettings({ ...settings, resellerMarkupValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>

                {settings.resellerMarkupValue > 0 && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
                    Example: Cost {formatPrice(exampleCost)} → <span className="text-blue-400">{formatPrice(calculateExample(settings.resellerMarkupType, settings.resellerMarkupValue))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Retail Markup */}
            <div className="bg-luxury-gray/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <h3 className="text-white font-medium">Retail Price Markup</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Markup Type</label>
                  <select
                    value={settings.retailMarkupType}
                    onChange={(e) => setSettings({ ...settings, retailMarkupType: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Markup Value {settings.retailMarkupType === "percentage" ? "(%)" : "(Rs)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={settings.retailMarkupType === "percentage" ? "0.1" : "1"}
                    value={settings.retailMarkupValue}
                    onChange={(e) => setSettings({ ...settings, retailMarkupValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-luxury-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>

                {settings.retailMarkupValue > 0 && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
                    Example: Cost {formatPrice(exampleCost)} → <span className="text-purple-400">{formatPrice(calculateExample(settings.retailMarkupType, settings.retailMarkupValue))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Apply to Existing */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="applyToExisting"
                checked={applyToExisting}
                onChange={(e) => setApplyToExisting(e.target.checked)}
                className="mt-1 w-4 h-4 text-luxury-gold bg-luxury-dark border-gray-600 rounded focus:ring-luxury-gold"
              />
              <div>
                <label htmlFor="applyToExisting" className="text-yellow-300 font-medium cursor-pointer">
                  Apply to existing products
                </label>
                <p className="text-yellow-400/70 text-sm mt-1">
                  Update prices for all products that have a cost price set
                </p>

                {applyToExisting && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="overrideExisting"
                      checked={overrideExisting}
                      onChange={(e) => setOverrideExisting(e.target.checked)}
                      className="w-4 h-4 text-luxury-gold bg-luxury-dark border-gray-600 rounded focus:ring-luxury-gold"
                    />
                    <label htmlFor="overrideExisting" className="text-yellow-300 text-sm cursor-pointer">
                      Override existing prices (by default, only updates products with price = 0)
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
