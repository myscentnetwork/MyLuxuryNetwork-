/**
 * @fileoverview Validation Utilities
 * @module utils/validation
 *
 * Pure utility functions for form and data validation.
 */

// ============== STRING VALIDATION ==============

/**
 * Checks if a value is a non-empty string
 *
 * @param value - Value to check
 * @returns True if non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates an email address format
 *
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number (Indian format)
 *
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  // Accepts: 10 digits, optionally prefixed with +91 or 0
  const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Validates a URL format
 *
 * @param url - URL to validate
 * @returns True if valid URL format
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============== NUMBER VALIDATION ==============

/**
 * Checks if a value is a positive number
 *
 * @param value - Value to check
 * @returns True if positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/**
 * Checks if a value is a non-negative number
 *
 * @param value - Value to check
 * @returns True if non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value >= 0;
}

/**
 * Validates a price value
 *
 * @param price - Price to validate
 * @returns True if valid price (non-negative number)
 */
export function isValidPrice(price: number | null | undefined): boolean {
  if (price === null || price === undefined) return false;
  return isNonNegativeNumber(price);
}

// ============== ARRAY VALIDATION ==============

/**
 * Checks if a value is a non-empty array
 *
 * @param value - Value to check
 * @returns True if non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// ============== OBJECT VALIDATION ==============

/**
 * Checks if a value is a non-null object
 *
 * @param value - Value to check
 * @returns True if non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if an object has all required fields
 *
 * @param obj - Object to check
 * @param requiredFields - Array of required field names
 * @returns True if all required fields exist and are non-empty
 */
export function hasRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return requiredFields.every((field) => {
    const value = obj[field];
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
}

// ============== FORM VALIDATION ==============

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validation rule type
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  message?: string;
}

/**
 * Validates a form field against rules
 *
 * @param value - Field value
 * @param rules - Validation rules
 * @returns Error message or null if valid
 */
export function validateField(
  value: unknown,
  rules: ValidationRule
): string | null {
  const { required, minLength, maxLength, pattern, custom, message } = rules;

  // Required check
  if (required) {
    if (value === null || value === undefined) {
      return message || "This field is required";
    }
    if (typeof value === "string" && value.trim().length === 0) {
      return message || "This field is required";
    }
  }

  // Skip other validations if value is empty and not required
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const strValue = String(value);

  // Min length check
  if (minLength !== undefined && strValue.length < minLength) {
    return message || `Minimum length is ${minLength} characters`;
  }

  // Max length check
  if (maxLength !== undefined && strValue.length > maxLength) {
    return message || `Maximum length is ${maxLength} characters`;
  }

  // Pattern check
  if (pattern && !pattern.test(strValue)) {
    return message || "Invalid format";
  }

  // Custom validation
  if (custom && !custom(value)) {
    return message || "Invalid value";
  }

  return null;
}

/**
 * Validates a form object against a schema
 *
 * @param data - Form data
 * @param schema - Validation schema (field name -> rules)
 * @returns Validation result with errors
 */
export function validateForm(
  data: Record<string, unknown>,
  schema: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
