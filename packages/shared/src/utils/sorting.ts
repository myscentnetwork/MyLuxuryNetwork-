/**
 * Sorting Utilities
 * Common sorting functions for entities
 */

// ============== SIZE SORTING ==============

// Predefined order for text-based sizes
const TEXT_SIZE_ORDER: Record<string, number> = {
  // General sizes
  "xxs": 1,
  "xs": 2,
  "s": 3,
  "small": 3,
  "mini": 3,
  "m": 4,
  "medium": 4,
  "l": 5,
  "large": 5,
  "xl": 6,
  "xxl": 7,
  "xxxl": 8,
  // Bag types (by typical size)
  "clutch": 10,
  "crossbody": 11,
  "shoulder": 12,
  "tote": 13,
  // Generic
  "one size": 100,
  "free size": 101,
};

/** Extract numeric value from size string (e.g., "30ml" -> 30, "42" -> 42) */
function extractNumber(size: string): number | null {
  const match = size.match(/^(\d+(?:\.\d+)?)/);
  if (match?.[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

/** Get sort key for a size */
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

/** Sort sizes array by name */
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

/** Sort size names array (for selected sizes display) */
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

/** Sort by date (newest first) */
export function sortByDate<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Sort by name alphabetically */
export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/** Sort by status (active first) */
export function sortByStatus<T extends { status: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return 0;
  });
}
