/**
 * Submission Preview Utilities
 * Extract and format preview data from form submissions
 */

const MAX_PREVIEW_FIELDS = 3;
const MAX_VALUE_LENGTH = 40;

/**
 * Format a field value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const stringValue = String(value);

  // Truncate long values
  if (stringValue.length > MAX_VALUE_LENGTH) {
    return stringValue.substring(0, MAX_VALUE_LENGTH) + '...';
  }

  return stringValue;
}

/**
 * Generate preview text from form submission data
 * Shows the first N field values (up to MAX_PREVIEW_FIELDS)
 *
 * @param data - Form submission data object
 * @returns Formatted preview string with bullet separators
 */
export function generateSubmissionPreview(data: Record<string, unknown>): string {
  const previewValues: string[] = [];

  // Get first N fields with non-empty values
  for (const [key, value] of Object.entries(data)) {
    if (previewValues.length >= MAX_PREVIEW_FIELDS) break;

    const formattedValue = formatValue(value);
    if (formattedValue) {
      previewValues.push(formattedValue);
    }
  }

  if (previewValues.length === 0) {
    return 'No data';
  }

  return previewValues.join(' • ');
}
