/**
 * Array Utilities - Malaysian E-commerce Platform
 * Array manipulation and processing functions
 */

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Group array items by key
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string | number, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string | number, T[]>
  );
}

/**
 * Sort array by key
 */
export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => any,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);

    if (aVal < bVal) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get random item from array
 */
export function randomItem<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 */
export function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffle([...array]);
  return shuffled.slice(0, count);
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Find intersection of arrays
 */
export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) {
    return [];
  }

  return arrays.reduce((acc, current) =>
    acc.filter(item => current.includes(item))
  );
}

/**
 * Find difference between arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => !array2.includes(item));
}

/**
 * Flatten nested arrays
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val),
    []
  );
}

/**
 * Move item in array
 */
export function moveItem<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Partition array based on predicate
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });

  return [truthy, falsy];
}

/**
 * Find item by property
 */
export function findBy<T>(
  array: T[],
  property: keyof T,
  value: any
): T | undefined {
  return array.find(item => item[property] === value);
}

/**
 * Calculate sum of numeric property
 */
export function sumBy<T>(array: T[], keyFn: (item: T) => number): number {
  return array.reduce((sum, item) => sum + keyFn(item), 0);
}

/**
 * Calculate average of numeric property
 */
export function averageBy<T>(array: T[], keyFn: (item: T) => number): number {
  if (array.length === 0) {
    return 0;
  }
  return sumBy(array, keyFn) / array.length;
}

/**
 * Find min value by property
 */
export function minBy<T>(
  array: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (array.length === 0) {
    return undefined;
  }

  return array.reduce((min, item) => (keyFn(item) < keyFn(min) ? item : min));
}

/**
 * Find max value by property
 */
export function maxBy<T>(
  array: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (array.length === 0) {
    return undefined;
  }

  return array.reduce((max, item) => (keyFn(item) > keyFn(max) ? item : max));
}

/**
 * Count occurrences of each value
 */
export function countBy<T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string | number, number> {
  return array.reduce(
    (counts, item) => {
      const key = keyFn(item);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    },
    {} as Record<string | number, number>
  );
}

/**
 * Create array of numbers in range
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Paginate array
 */
export function paginate<T>(
  array: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const items = array.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalPages,
    currentPage,
    totalItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Check if array is empty or contains only falsy values
 */
export function isEmpty<T>(array: T[]): boolean {
  return array.length === 0 || array.every(item => !item);
}

/**
 * Compact array (remove falsy values)
 */
export function compact<T>(
  array: (T | null | undefined | false | 0 | '')[]
): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Create frequency map
 */
export function frequency<T>(array: T[]): Map<T, number> {
  const map = new Map<T, number>();

  array.forEach(item => {
    map.set(item, (map.get(item) || 0) + 1);
  });

  return map;
}

/**
 * Binary search in sorted array
 */
export function binarySearch<T>(
  array: T[],
  target: T,
  compareFn?: (a: T, b: T) => number
): number {
  let left = 0;
  let right = array.length - 1;

  const compare = compareFn || ((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(array[mid], target);

    if (comparison === 0) {
      return mid;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1; // Not found
}
