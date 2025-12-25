"use client";

import { forwardRef } from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;
}

const variantStyles = {
  primary: "bg-luxury-gold hover:bg-yellow-600 text-black font-semibold",
  secondary: "bg-luxury-gray hover:bg-gray-600 text-white font-semibold",
  danger: "bg-red-500 hover:bg-red-600 text-white font-semibold",
  ghost: "bg-transparent hover:bg-luxury-gray text-gray-400 hover:text-white",
};

const sizeStyles = {
  sm: "py-2 px-4 text-sm",
  md: "py-3 px-6 text-base",
  lg: "py-4 px-8 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      href,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `inline-flex items-center justify-center gap-2 rounded-lg transition-all ${variantStyles[variant]} ${sizeStyles[size]}`;
    const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";

    if (href && !disabled) {
      return (
        <Link href={href} className={`${baseStyles} ${className}`}>
          {icon}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${disabledStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
