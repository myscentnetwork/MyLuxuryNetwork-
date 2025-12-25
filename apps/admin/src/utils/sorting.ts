/**
 * @fileoverview Sorting Utilities
 * @module utils/sorting
 *
 * Pure utility functions for sorting arrays of data.
 */

// ============== SIZE SORTING ==============

/**
 * Predefined order for text-based sizes
 */
const TEXT_SIZE_ORDER: Record<string, number> = {
  // General sizes
  xxs: 1,
  xs: 2,
  s: 3,
  small: 3,
  mini: 3,
  m: 4,
  medium: 4,
  l: 5,
  large: 5,
  xl: 6,
  xxl: 7,
  xxxl: 8,
  // Bag types (by typical size)
  clutch: 10,
  crossbody: 11,
  shoulder: 12,
  tote: 13,
  // Generic
  "one size": 100,
  "free size": 101,
};

/**
 * Extracts numeric value from size string
 *
 * @param size - Size string (e.g., "30ml", "42")
 * @returns Extracted number or null
 *
 * @example
 * extractNumber("30ml") // 30
 * extractNumber("42") // 42
 * extractNumber("large") // null
 */
function extractNumber(size: string): number | null {
  const match = size.match(/^(\d+(?:\.\d+)?)/);
  if (match?.[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Gets sort key for a size name
 *
 * @param sizeName - Size name to get key for
 * @returns Sort key with type and value
 */
function getSortKey(sizeName: string): { type: "number" | "text"; value: number } {
  const lowerName = sizeName.toLowerCase().trim();

  // Check if it's a numeric size (e.g., "30ml", "42", "100ml")
  const numValue = extractNumber(sizeName);
  if (numValue !== null) {
    return { type: "number", value: numValue };
  }

  // Check if it's a known text size
  if (TEXT_SIZE_ORDER[lowerName] !== undefined) {
    return { type: "text", value: TEXT_SIZE_ORDER[lowerName] };
  }

  // Unknown text - sort alphabetically at the end
  return { type: "text", value: 1000 + lowerName.charCodeAt(0) };
}

/**
 * Sorts an array of size objects by name
 *
 * @param sizes - Array of objects with name property
 * @returns Sorted array (numbers first, then text sizes)
 *
 * @example
 * sortSizes([{ name: "L" }, { name: "30ml" }, { name: "S" }])
 * // [{ name: "30ml" }, { name: "S" }, { name: "L" }]
 */
export function sortSizes<T extends { name: string }>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => {
    const keyA = getSortKey(a.name);
    const keyB = getSortKey(b.name);

    // Numbers come before text sizes
    if (keyA.type !== keyB.type) {
      return keyA.type === "number" ? -1 : 1;
    }

    // Same type - compare values
    return keyA.value - keyB.value;
  });
}

/**
 * Sorts an array of size name strings
 *
 * @param sizeNames - Array of size name strings
 * @returns Sorted array
 */
export function sortSizeNames(sizeNames: string[]): string[] {
  return [...sizeNames].sort((a, b) => {
    const keyA = getSortKey(a);
    const keyB = getSortKey(b);

    if (keyA.type !== keyB.type) {
      return keyA.type === "number" ? -1 : 1;
    }

    return keyA.value - keyB.value;
  });
}

// ============== GENERIC SORTING ==============

/**
 * Sort direction type
 */
export type SortDirection = "asc" | "desc";

/**
 * Creates a comparator function for sorting by a specific key
 *
 * @param key - Object key to sort by
 * @param direction - Sort direction (asc/desc)
 * @returns Comparator function
 *
 * @example
 * products.sort(sortByKey('name', 'asc'))
 */
export function sortByKey<T>(
  key: keyof T,
  direction: SortDirection = "asc"
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const valueA = a[key];
    const valueB = b[key];

    let comparison = 0;

    if (valueA === null || valueA === undefined) {
      comparison = 1;
    } else if (valueB === null || valueB === undefined) {
      comparison = -1;
    } else if (typeof valueA === "string" && typeof valueB === "string") {
      comparison = valueA.localeCompare(valueB);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      comparison = valueA - valueB;
    } else if (valueA instanceof Date && valueB instanceof Date) {
      comparison = valueA.getTime() - valueB.getTime();
    }

    return direction === "desc" ? -comparison : comparison;
  };
}

/**
 * Sorts an array by multiple keys with directions
 *
 * @param keys - Array of [key, direction] tuples
 * @returns Comparator function
 *
 * @example
 * products.sort(sortByMultipleKeys([['category', 'asc'], ['name', 'asc']]))
 */
export function sortByMultipleKeys<T>(
  keys: [keyof T, SortDirection][]
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    for (const [key, direction] of keys) {
      const comparator = sortByKey<T>(key, direction);
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

/**
 * Sorts an array by date (newest first by default)
 *
 * @param array - Array to sort
 * @param dateKey - Key containing date value
 * @param direction - Sort direction (default: desc for newest first)
 * @returns Sorted array
 */
export function sortByDate<T>(
  array: T[],
  dateKey: keyof T,
  direction: SortDirection = "desc"
): T[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey] as unknown as string).getTime();
    const dateB = new Date(b[dateKey] as unknown as string).getTime();

    return direction === "desc" ? dateB - dateA : dateA - dateB;
  });
}
