/**
 * Email Notification Service for Form Submissions
 * Handles sending email notifications when forms are submitted on click pages
 */

import { emailService } from '@/lib/email/email-service';

export interface FormSubmissionNotificationData {
  clickPageSlug: string;
  blockId: string;
  formTitle: string;
  submissionData: Record<string, unknown>;
  recipients: string[];
  subject: string;
  submittedAt: Date;
}

export class EmailNotificationService {
  /**
   * Send form submission notification to configured recipients
   */
  static async sendFormSubmissionNotification(
    data: FormSubmissionNotificationData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const html = this.generateFormSubmissionHTML(data);

      const result = await emailService.sendEmail({
        to: data.recipients,
        subject: data.subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Form submission notification error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send form submission notification',
      };
    }
  }

  /**
   * Generate HTML for form submission notification email
   */
  private static generateFormSubmissionHTML(
    data: FormSubmissionNotificationData
  ): string {
    const formattedDate = data.submittedAt.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const submissionFields = Object.entries(data.submissionData)
      .map(
        ([key, value]) => `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #f8f9fa; font-weight: bold;">${this.formatFieldLabel(key)}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${this.formatFieldValue(value)}</td>
          </tr>
        `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Submission Notification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f6f9fc;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 24px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 32px;
            border: 1px solid #e6ebf1;
            border-top: none;
          }
          .info-box {
            background-color: #f0f9ff;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .submission-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #ddd;
          }
          .submission-table th,
          .submission-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .submission-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            margin-top: 8px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e6ebf1;
          }
          .badge {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📝 New Form Submission</h1>
          <p style="margin: 8px 0 0 0; font-size: 18px;">${data.formTitle}</p>
        </div>

        <div class="content">
          <div class="info-box">
            <p style="margin: 0 0 8px 0;"><strong>Page:</strong> ${data.clickPageSlug}</p>
            <p style="margin: 0 0 8px 0;"><strong>Submitted At:</strong> ${formattedDate}</p>
            <p style="margin: 0;"><strong>Form Block ID:</strong> ${data.blockId}</p>
          </div>

          <h2 style="margin: 24px 0 16px 0; color: #1a1a1a;">Submission Details</h2>

          <table class="submission-table">
            <thead>
              <tr>
                <th style="width: 35%;">Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${submissionFields}
            </tbody>
          </table>

          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 6px; margin-top: 24px;">
            <p style="margin: 0; color: #92400e;">
              <strong>💡 Tip:</strong> You can view and manage all form submissions in your admin dashboard.
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
            This is an automated notification from your JRM E-commerce Click Page.
          </p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            &copy; 2024 JRM E-commerce. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format field label from camelCase or snake_case to Title Case
   */
  private static formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Format field value for display
   */
  private static formatFieldValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '<em style="color: #9ca3af;">Not provided</em>';
    }

    if (typeof value === 'boolean') {
      return value ? '✅ Yes' : '❌ No';
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? `<ul style="margin: 0; padding-left: 20px;">${value.map((item) => `<li>${this.escapeHtml(String(item))}</li>`).join('')}</ul>`
        : '<em style="color: #9ca3af;">Empty list</em>';
    }

    if (typeof value === 'object') {
      return `<pre style="margin: 0; background-color: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    }

    return this.escapeHtml(String(value));
  }

  /**
   * Escape HTML to prevent XSS
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
