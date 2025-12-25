/**
 * @fileoverview Authentication Service
 * @module services/auth/authService
 *
 * Client-side authentication utilities for managing user sessions.
 * Handles cookie-based authentication for different user types.
 */

// ============== TYPES ==============

export type UserType = "admin" | "wholesaler" | "reseller" | "retailer";

export interface UserSession {
  id: string;
  name: string;
  type: UserType;
  email?: string;
}

// ============== CONSTANTS ==============

const AUTH_COOKIE_NAMES: Record<UserType, string> = {
  admin: "admin_auth",
  wholesaler: "wholesale_auth",
  reseller: "reseller_auth",
  retailer: "retail_auth",
};

const SESSION_DURATION_DAYS = 7;

// ============== COOKIE UTILITIES ==============

/**
 * Gets a cookie value by name
 *
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const parts = cookie.trim().split("=");
    const key = parts[0];
    const value = parts.slice(1).join("=");
    if (key) acc[key] = value || "";
    return acc;
  }, {} as Record<string, string>);

  return cookies[name] || null;
}

/**
 * Sets a cookie with optional expiry
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Number of days until expiry (default: 7)
 */
export function setCookie(name: string, value: string, days: number = SESSION_DURATION_DAYS): void {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Removes a cookie by setting its expiry to the past
 *
 * @param name - Cookie name
 */
export function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

// ============== AUTH SERVICE ==============

/**
 * Gets the auth cookie name for a user type
 *
 * @param userType - Type of user
 * @returns Cookie name
 */
export function getAuthCookieName(userType: UserType): string {
  return AUTH_COOKIE_NAMES[userType];
}

/**
 * Sets the auth cookie for a user type
 *
 * @param userType - Type of user
 * @param value - Session value (usually user ID or encoded session)
 */
export function setAuthCookie(userType: UserType, value: string): void {
  const cookieName = AUTH_COOKIE_NAMES[userType];
  setCookie(cookieName, value);
}

/**
 * Gets the auth cookie for a user type
 *
 * @param userType - Type of user
 * @returns Cookie value or null
 */
export function getAuthCookie(userType: UserType): string | null {
  const cookieName = AUTH_COOKIE_NAMES[userType];
  return getCookie(cookieName);
}

/**
 * Clears the auth cookie for a user type
 *
 * @param userType - Type of user
 */
export function clearAuthCookie(userType: UserType): void {
  const cookieName = AUTH_COOKIE_NAMES[userType];
  removeCookie(cookieName);
}

/**
 * Checks if a user type is authenticated
 *
 * @param userType - Type of user
 * @returns Whether the user is authenticated
 */
export function isAuthenticated(userType: UserType): boolean {
  return !!getAuthCookie(userType);
}

/**
 * Gets user info from cookies for portal users
 *
 * @returns User session info or null
 */
export function getPortalUserInfo(): UserSession | null {
  // Check each user type in order of priority
  const userTypes: UserType[] = ["wholesaler", "reseller", "retailer"];

  for (const type of userTypes) {
    const cookie = getAuthCookie(type);
    if (cookie) {
      try {
        // Cookie format: id|name|email (pipe-separated)
        const [id, name, email] = cookie.split("|");
        if (id && name) {
          return {
            id,
            name: decodeURIComponent(name),
            type,
            email: email ? decodeURIComponent(email) : undefined,
          };
        }
      } catch {
        // If parsing fails, try as just the ID
        return {
          id: cookie,
          name: "User",
          type,
        };
      }
    }
  }

  return null;
}

/**
 * Logs out a user by clearing their auth cookie
 *
 * @param userType - Type of user to log out
 */
export function logout(userType: UserType): void {
  clearAuthCookie(userType);
}

/**
 * Logs out all user types (complete session clear)
 */
export function logoutAll(): void {
  const userTypes: UserType[] = ["admin", "wholesaler", "reseller", "retailer"];
  userTypes.forEach(clearAuthCookie);
}

// ============== ROUTE HELPERS ==============

/**
 * Gets the login route for a user type
 *
 * @param userType - Type of user
 * @returns Login route path
 */
export function getLoginRoute(userType: UserType): string {
  const routes: Record<UserType, string> = {
    admin: "/login",
    wholesaler: "/wholesale/login",
    reseller: "/reseller/login",
    retailer: "/retail/login",
  };
  return routes[userType];
}

/**
 * Gets the dashboard route for a user type
 *
 * @param userType - Type of user
 * @returns Dashboard route path
 */
export function getDashboardRoute(userType: UserType): string {
  const routes: Record<UserType, string> = {
    admin: "/admin/dashboard",
    wholesaler: "/wholesale/dashboard",
    reseller: "/portal/dashboard",
    retailer: "/portal/dashboard",
  };
  return routes[userType];
}
