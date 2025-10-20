/**
 * Password Reset Email Template
 * SINGLE SOURCE OF TRUTH for password reset email
 *
 * Following CLAUDE.md standards:
 * - No hardcoding (centralized config)
 * - Type safety (explicit props interface)
 * - Security first (secure links, time-limited tokens)
 */

import * as React from 'react';

// CENTRALIZED CONFIGURATION
const EMAIL_CONFIG = {
  BRAND_NAME: 'JRM E-commerce',
  SUPPORT_EMAIL: 'support@jrmecommerce.com',
  BRAND_COLOR: '#2563eb',
  TOKEN_EXPIRY_HOURS: 1,
} as const;

export interface PasswordResetEmailProps {
  resetLink: string;
  userEmail: string;
  userName?: string;
}

/**
 * Password Reset Email Component
 * Generates HTML email for password reset requests
 */
export function PasswordResetEmail({
  resetLink,
  userEmail,
  userName,
}: PasswordResetEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset Request</title>
        <style>{`
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            margin: 20px auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: ${EMAIL_CONFIG.BRAND_COLOR};
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            background-color: ${EMAIL_CONFIG.BRAND_COLOR};
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
          }
          .reset-button:hover {
            background-color: #1d4ed8;
          }
          .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .link-text {
            word-break: break-all;
            color: #666;
            font-size: 12px;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>🔒 Password Reset Request</h1>
          </div>

          <div className="content">
            <p>
              Hello{userName ? ` ${userName}` : ''},
            </p>

            <p>
              We received a request to reset the password for your {EMAIL_CONFIG.BRAND_NAME} account
              associated with <strong>{userEmail}</strong>.
            </p>

            <p>
              If you made this request, click the button below to reset your password:
            </p>

            <div className="button-container">
              <a href={resetLink} className="reset-button">
                Reset My Password
              </a>
            </div>

            <p style={{ fontSize: '14px', color: '#666' }}>
              Or copy and paste this link into your browser:
            </p>
            <div className="link-text">{resetLink}</div>

            <div className="info-box">
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>⏱️ Important:</strong> This password reset link will expire in{' '}
                <strong>{EMAIL_CONFIG.TOKEN_EXPIRY_HOURS} hour</strong>.
              </p>
              <p style={{ margin: 0 }}>
                For security reasons, you can only use this link once.
              </p>
            </div>

            <div className="warning-box">
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>⚠️ Did not request this?</strong>
              </p>
              <p style={{ margin: 0 }}>
                If you didn't request a password reset, you can safely ignore this email.
                Your password will remain unchanged. However, if you're concerned about your
                account security, please contact us immediately at {EMAIL_CONFIG.SUPPORT_EMAIL}.
              </p>
            </div>

            <p>
              For your security, we recommend:
            </p>
            <ul>
              <li>Using a strong, unique password (at least 8 characters)</li>
              <li>Including uppercase, lowercase, numbers, and special characters</li>
              <li>Never sharing your password with anyone</li>
              <li>Using different passwords for different accounts</li>
            </ul>

            <p>
              If you have any questions or need assistance, please don't hesitate to contact
              our support team at {EMAIL_CONFIG.SUPPORT_EMAIL}.
            </p>

            <p>
              Thank you,
              <br />
              <strong>The {EMAIL_CONFIG.BRAND_NAME} Team</strong>
            </p>
          </div>

          <div className="footer">
            <p>
              &copy; {new Date().getFullYear()} {EMAIL_CONFIG.BRAND_NAME}. All rights reserved.
            </p>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
              This is an automated email. Please do not reply to this message.
              <br />
              If you need help, contact us at {EMAIL_CONFIG.SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

/**
 * Generate HTML string from template
 * For use with email service
 */
export function generatePasswordResetEmailHTML(props: PasswordResetEmailProps): string {
  // React.createElement equivalent for server-side rendering
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          margin: 20px auto;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: ${EMAIL_CONFIG.BRAND_COLOR};
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reset-button {
          display: inline-block;
          background-color: ${EMAIL_CONFIG.BRAND_COLOR};
          color: white;
          padding: 14px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
        }
        .reset-button:hover {
          background-color: #1d4ed8;
        }
        .info-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box {
          background-color: #fee2e2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .link-text {
          word-break: break-all;
          color: #666;
          font-size: 12px;
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>

        <div class="content">
          <p>Hello${props.userName ? ` ${props.userName}` : ''},</p>

          <p>
            We received a request to reset the password for your ${EMAIL_CONFIG.BRAND_NAME} account
            associated with <strong>${props.userEmail}</strong>.
          </p>

          <p>If you made this request, click the button below to reset your password:</p>

          <div class="button-container">
            <a href="${props.resetLink}" class="reset-button">Reset My Password</a>
          </div>

          <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
          <div class="link-text">${props.resetLink}</div>

          <div class="info-box">
            <p style="margin: 0 0 10px 0;">
              <strong>⏱️ Important:</strong> This password reset link will expire in
              <strong>${EMAIL_CONFIG.TOKEN_EXPIRY_HOURS} hour</strong>.
            </p>
            <p style="margin: 0;">For security reasons, you can only use this link once.</p>
          </div>

          <div class="warning-box">
            <p style="margin: 0 0 10px 0;"><strong>⚠️ Did not request this?</strong></p>
            <p style="margin: 0;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will remain unchanged. However, if you're concerned about your
              account security, please contact us immediately at ${EMAIL_CONFIG.SUPPORT_EMAIL}.
            </p>
          </div>

          <p>For your security, we recommend:</p>
          <ul>
            <li>Using a strong, unique password (at least 8 characters)</li>
            <li>Including uppercase, lowercase, numbers, and special characters</li>
            <li>Never sharing your password with anyone</li>
            <li>Using different passwords for different accounts</li>
          </ul>

          <p>
            If you have any questions or need assistance, please don't hesitate to contact
            our support team at ${EMAIL_CONFIG.SUPPORT_EMAIL}.
          </p>

          <p>
            Thank you,<br>
            <strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong>
          </p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.BRAND_NAME}. All rights reserved.</p>
          <p style="font-size: 12px; margin-top: 10px; color: #999;">
            This is an automated email. Please do not reply to this message.<br>
            If you need help, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
