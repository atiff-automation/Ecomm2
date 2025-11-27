/**
 * Submission Enhancer Utilities
 * Map field IDs to human-readable labels from form block configuration
 */

import type { Block, FormField } from '@/types/click-page.types';

/**
 * Enhanced submission data with field labels
 */
export interface EnhancedSubmissionField {
  fieldId: string;
  label: string;
  value: unknown;
}

/**
 * Build a field ID to label mapping from click page blocks
 *
 * @param blocks - Click page blocks array
 * @returns Map of field IDs to their labels
 */
export function buildFieldLabelMap(blocks: Block[]): Map<string, string> {
  const fieldLabelMap = new Map<string, string>();

  for (const block of blocks) {
    // Only process FORM blocks
    if (block.type === 'FORM') {
      const formFields = block.settings.fields as FormField[];

      for (const field of formFields) {
        fieldLabelMap.set(field.id, field.label);
      }
    }
  }

  return fieldLabelMap;
}

/**
 * Enhance submission data by mapping field IDs to labels
 *
 * @param submissionData - Raw submission data with field IDs as keys
 * @param fieldLabelMap - Map of field IDs to labels
 * @returns Array of enhanced submission fields with labels
 */
export function enhanceSubmissionData(
  submissionData: Record<string, unknown>,
  fieldLabelMap: Map<string, string>
): EnhancedSubmissionField[] {
  const enhancedFields: EnhancedSubmissionField[] = [];

  for (const [fieldId, value] of Object.entries(submissionData)) {
    const label = fieldLabelMap.get(fieldId) || fieldId; // Fallback to field ID if label not found

    enhancedFields.push({
      fieldId,
      label,
      value,
    });
  }

  return enhancedFields;
}

/**
 * Format a field value for display
 */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
