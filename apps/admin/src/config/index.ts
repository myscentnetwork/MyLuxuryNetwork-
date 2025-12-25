/**
 * @fileoverview Configuration Barrel Export
 * @module config
 *
 * Application configuration and environment settings.
 */

/**
 * Environment configuration
 */
export const config = {
  /** Application name */
  appName: "MyLuxuryNetwork Admin",

  /** API base URL */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",

  /** Is development environment */
  isDev: process.env.NODE_ENV === "development",

  /** Is production environment */
  isProd: process.env.NODE_ENV === "production",
} as const;
