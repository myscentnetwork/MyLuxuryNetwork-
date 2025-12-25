/**
 * Validation Utilities
 * Common validation functions
 */

// ============== STRING VALIDATION ==============

/** Check if string is empty or whitespace only */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/** Check if string is a valid email */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** Check if string is a valid URL */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Check if string is a valid phone number (basic check) */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

// ============== NUMBER VALIDATION ==============

/** Check if value is a positive number */
export function isPositiveNumber(value: number): boolean {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/** Check if value is a non-negative number */
export function isNonNegativeNumber(value: number): boolean {
  return typeof value === "number" && !isNaN(value) && value >= 0;
}

/** Check if value is within range */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// ============== FILE VALIDATION ==============

/** Check if file is within size limit */
export function isWithinSizeLimit(sizeBytes: number, maxBytes: number): boolean {
  return sizeBytes <= maxBytes;
}

/** Check if file type is in allowed types */
export function isAllowedFileType(type: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(type);
}

/** Check if string is a valid base64 image */
export function isBase64Image(str: string): boolean {
  return str.startsWith("data:image/");
}

/** Check if string is a valid base64 video */
export function isBase64Video(str: string): boolean {
  return str.startsWith("data:video/");
}

// ============== ENTITY VALIDATION ==============

/** Validate required fields exist */
export function hasRequiredFields<T extends object>(
  obj: T,
  requiredFields: (keyof T)[]
): boolean {
  return requiredFields.every((field) => {
    const value = obj[field];
    if (typeof value === "string") {
      return !isEmpty(value);
    }
    return value !== null && value !== undefined;
  });
}

/** Validate entity data with custom rules */
export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: T[keyof T], obj: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEntity<T extends object>(
  obj: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = obj[rule.field];
    if (!rule.validate(value, obj)) {
      errors[rule.field as string] = rule.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
