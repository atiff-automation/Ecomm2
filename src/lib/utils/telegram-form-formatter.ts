/**
 * Telegram Form Formatter Utility
 * Formats form submission data into HTML messages for Telegram
 */

import type {
  FormSubmissionData,
  ClickPageData,
  FormBlockData,
  FormField,
} from '@/types/telegram.types';

export class TelegramFormFormatter {
  /**
   * Format form submission data into HTML message for Telegram
   *
   * @param submission - Form submission data from database
   * @param clickPage - Click page information
   * @param formBlock - Form block configuration with field definitions
   * @param baseUrl - Application base URL for generating admin links
   * @returns HTML-formatted string ready for Telegram send (max 4096 chars)
   *
   * @example
   * ```typescript
   * const message = TelegramFormFormatter.formatFormSubmissionForTelegram(
   *   submissionData,
   *   pageData,
   *   blockData,
   *   'https://example.com'
   * );
   * ```
   */
  static formatFormSubmissionForTelegram(
    submission: FormSubmissionData,
    clickPage: ClickPageData,
    formBlock: FormBlockData,
    baseUrl: string
  ): string {
    const formattedTime = this.formatTimestamp(submission.createdAt);
    const formTitle = formBlock.settings.title || 'Untitled Form';
    const adminLink = `${baseUrl}/admin/click-pages/${clickPage.id}/submissions`;

    // Build field list
    const fieldsHTML = this.formatFields(
      submission.data,
      formBlock.settings.fields
    );

    // Build complete message
    const message = `🔔 <b>New Form Submission</b>

📄 <b>Page:</b> ${this.escapeHTML(clickPage.title)}
📝 <b>Form:</b> ${this.escapeHTML(formTitle)}
🕒 <b>Time:</b> ${formattedTime}

📋 <b>Submitted Data:</b>
━━━━━━━━━━━━━━━━
${fieldsHTML}

🔗 <a href="${adminLink}">View Details in Admin Panel</a>

${submission.ipAddress ? `IP: ${submission.ipAddress}` : ''}${submission.ipAddress && submission.userAgent ? '\n' : ''}${submission.userAgent ? `User Agent: ${this.truncateValue(submission.userAgent, 50)}` : ''}`;

    return message.trim();
  }

  /**
   * Format individual fields with labels
   *
   * @param data - Form submission data (field ID -> value)
   * @param fields - Field definitions with labels
   * @returns HTML-formatted field list
   */
  private static formatFields(
    data: Record<string, unknown>,
    fields: FormField[]
  ): string {
    // Create field ID to label mapping
    const fieldMap = new Map(fields.map((f) => [f.id, f.label]));
    const formattedFields: string[] = [];

    // Format each field
    for (const [fieldId, value] of Object.entries(data)) {
      const label = fieldMap.get(fieldId) || fieldId;
      const formattedValue = this.formatFieldValue(value);
      formattedFields.push(
        `• <b>${this.escapeHTML(label)}:</b> ${formattedValue}`
      );
    }

    return formattedFields.join('\n');
  }

  /**
   * Format different value types appropriately
   *
   * @param value - Field value to format
   * @returns HTML-formatted value string
   */
  private static formatFieldValue(value: unknown): string {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '<i>(empty)</i>';
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? '✅ Yes' : '❌ No';
    }

    // Handle array
    if (Array.isArray(value)) {
      return this.escapeHTML(value.join(', '));
    }

    // Handle object
    if (typeof value === 'object') {
      return `<code>${this.escapeHTML(JSON.stringify(value))}</code>`;
    }

    // Handle string/number - truncate if too long
    const stringValue = String(value);
    const truncated = this.truncateValue(stringValue, 200);
    return this.escapeHTML(truncated);
  }

  /**
   * Escape HTML special characters to prevent injection
   *
   * @param text - Text to escape
   * @returns HTML-safe text
   */
  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Truncate long values with ellipsis
   *
   * @param value - Value to truncate
   * @param maxLength - Maximum length before truncation
   * @returns Truncated value
   */
  private static truncateValue(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + '...';
  }

  /**
   * Format timestamp in Malaysia timezone
   *
   * @param date - Date to format
   * @returns Formatted timestamp with timezone
   */
  private static formatTimestamp(date: Date): string {
    return (
      new Intl.DateTimeFormat('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date) + ' MYT'
    );
  }

  /**
   * Validate message length (Telegram limit: 4096 characters)
   *
   * @param message - Message to validate
   * @returns Validation result with length
   */
  static validateMessageLength(message: string): {
    valid: boolean;
    length: number;
  } {
    const length = message.length;
    return {
      valid: length <= 4096,
      length,
    };
  }
}
