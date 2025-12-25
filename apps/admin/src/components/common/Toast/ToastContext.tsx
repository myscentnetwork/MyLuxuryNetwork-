"use client";

/**
 * @fileoverview Toast Notification System
 * @module components/common/Toast/ToastContext
 *
 * Provides a context-based toast notification system for the application.
 * Replaces browser alert() with styled, auto-dismissing notifications.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ============== TYPES ==============

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

// ============== CONTEXT ==============

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============== PROVIDER ==============

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ============== HOOK ==============

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============== TOAST CONTAINER ==============

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// ============== TOAST ITEM ==============

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-green-900/90",
    icon: "✓",
    border: "border-green-500/50",
  },
  error: {
    bg: "bg-red-900/90",
    icon: "✕",
    border: "border-red-500/50",
  },
  warning: {
    bg: "bg-yellow-900/90",
    icon: "⚠",
    border: "border-yellow-500/50",
  },
  info: {
    bg: "bg-blue-900/90",
    icon: "ℹ",
    border: "border-blue-500/50",
  },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const style = TOAST_STYLES[toast.type];

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in ${style.bg} ${style.border}`}
      role="alert"
    >
      <span className="text-lg">{style.icon}</span>
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
