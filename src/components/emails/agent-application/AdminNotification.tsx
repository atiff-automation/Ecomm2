/**
 * Admin Notification Email Template
 * Sent to admin team when new agent application is submitted
 * Following CLAUDE.md principles: Systematic design, centralized styling
 */

import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Row,
  Column,
} from '@react-email/components';

interface AdminNotificationProps {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: Date;
  reviewUrl?: string;
  applicantDetails?: {
    phoneNumber?: string;
    age?: number;
    businessLocation?: string;
    hasBusinessExp?: boolean;
    hasJrmExp?: boolean;
  };
}

export const AdminNotification = ({
  applicationId,
  applicantName,
  applicantEmail,
  submissionDate,
  reviewUrl = `${process.env.NEXTAUTH_URL}/admin/agents/applications/${applicationId}`,
  applicantDetails
}: AdminNotificationProps) => {
  const formattedDate = submissionDate.toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${process.env.NEXTAUTH_URL}/images/jrm-logo.png`}
              width="120"
              height="40"
              alt="JRM Logo"
              style={logo}
            />
            <Text style={headerTitle}>Admin Notification</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={alertBadge}>
              🔔 New Agent Application
            </Text>

            <Text style={greeting}>
              Dear Admin Team,
            </Text>

            <Text style={paragraph}>
              A new agent application has been submitted and requires your review.
              Please review the application details below and take appropriate action.
            </Text>

            {/* Application Summary Box */}
            <Section style={summaryBox}>
              <Text style={summaryTitle}>Application Summary</Text>

              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Application ID:</Text>
                </Column>
                <Column>
                  <Text style={value}>{applicationId}</Text>
                </Column>
              </Row>

              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Applicant Name:</Text>
                </Column>
                <Column>
                  <Text style={value}>{applicantName}</Text>
                </Column>
              </Row>

              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Email:</Text>
                </Column>
                <Column>
                  <Text style={value}>{applicantEmail}</Text>
                </Column>
              </Row>

              {applicantDetails?.phoneNumber && (
                <Row>
                  <Column style={labelColumn}>
                    <Text style={label}>Phone:</Text>
                  </Column>
                  <Column>
                    <Text style={value}>{applicantDetails.phoneNumber}</Text>
                  </Column>
                </Row>
              )}

              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Submitted:</Text>
                </Column>
                <Column>
                  <Text style={value}>{formattedDate}</Text>
                </Column>
              </Row>

              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Status:</Text>
                </Column>
                <Column>
                  <Text style={statusValue}>PENDING REVIEW</Text>
                </Column>
              </Row>
            </Section>

            {/* Quick Insights */}
            {applicantDetails && (
              <Section style={insightsBox}>
                <Text style={insightsTitle}>Quick Insights</Text>

                <Row>
                  <Column style={insightColumn}>
                    <Text style={insightLabel}>Age</Text>
                    <Text style={insightValue}>{applicantDetails.age || 'N/A'}</Text>
                  </Column>
                  <Column style={insightColumn}>
                    <Text style={insightLabel}>Business Experience</Text>
                    <Text style={insightValue}>{applicantDetails.hasBusinessExp ? '✅ Yes' : '❌ No'}</Text>
                  </Column>
                  <Column style={insightColumn}>
                    <Text style={insightLabel}>JRM Experience</Text>
                    <Text style={insightValue}>{applicantDetails.hasJrmExp ? '✅ Yes' : '❌ No'}</Text>
                  </Column>
                </Row>

                {applicantDetails.businessLocation && (
                  <Row>
                    <Column>
                      <Text style={insightLabel}>Business Location</Text>
                      <Text style={insightValue}>{applicantDetails.businessLocation}</Text>
                    </Column>
                  </Row>
                )}
              </Section>
            )}

            {/* Action Required */}
            <Section style={actionBox}>
              <Text style={actionTitle}>Action Required</Text>
              <Text style={actionText}>
                Please review this application within <strong>3 business days</strong> to maintain our service standards.
              </Text>

              <Section style={buttonContainer}>
                <Button
                  style={reviewButton}
                  href={reviewUrl}
                >
                  Review Application
                </Button>
              </Section>
            </Section>

            <Hr style={hr} />

            {/* Review Guidelines */}
            <Text style={guidelinesTitle}>Review Guidelines</Text>

            <Text style={guideline}>
              ✅ <strong>Approve if:</strong> Applicant meets age requirements, has relevant experience, and shows genuine interest
            </Text>

            <Text style={guideline}>
              ⏳ <strong>Request more info if:</strong> Application lacks crucial details or requires clarification
            </Text>

            <Text style={guideline}>
              ❌ <strong>Reject if:</strong> Applicant doesn't meet basic criteria or shows inappropriate intent
            </Text>

            <Hr style={hr} />

            {/* System Information */}
            <Text style={systemInfo}>
              <strong>System Information:</strong><br />
              Notification sent at: {new Date().toLocaleString('ms-MY')}<br />
              Application tracking: {applicationId}<br />
              Review dashboard: Admin Portal → Agent Applications
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={disclaimer}>
              This is an automated notification. Do not reply to this email.
              Access the admin panel to take action on this application.
            </Text>
            <Text style={copyright}>
              © 2024 JRM Enterprise. Admin Notification System.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderRadius: '8px 8px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '16px 0 0 0',
};

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderTop: 'none',
  borderRadius: '0 0 8px 8px',
  padding: '32px',
};

const alertBadge = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '8px 12px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 24px 0',
};

const summaryBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const summaryTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const labelColumn = {
  width: '140px',
  verticalAlign: 'top',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const value = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
  fontFamily: 'monospace',
};

const statusValue = {
  fontSize: '14px',
  color: '#dc2626',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const insightsBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const insightsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const insightColumn = {
  textAlign: 'center' as const,
  padding: '0 8px',
};

const insightLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
};

const insightValue = {
  fontSize: '14px',
  color: '#1a1a1a',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const actionBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const actionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px 0',
};

const actionText = {
  fontSize: '16px',
  color: '#92400e',
  margin: '0 0 20px 0',
  lineHeight: '1.5',
};

const buttonContainer = {
  margin: '16px 0 0 0',
};

const reviewButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const guidelinesTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const guideline = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px 0',
};

const systemInfo = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#6b7280',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '12px',
  margin: '16px 0 0 0',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e6ebf1',
  borderRadius: '0 0 8px 8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginTop: '8px',
};

const disclaimer = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
};

const copyright = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
};

export default AdminNotification;