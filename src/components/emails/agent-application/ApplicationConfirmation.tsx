/**
 * Agent Application Confirmation Email Template
 * Sent to applicants after successful submission
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

interface ApplicationConfirmationProps {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: Date;
  trackingUrl?: string;
}

export const ApplicationConfirmation = ({
  applicationId,
  applicantName,
  applicantEmail,
  submissionDate,
  trackingUrl = `${process.env.NEXTAUTH_URL}/apply-agent/status?id=${applicationId}`,
}: ApplicationConfirmationProps) => {
  const formattedDate = submissionDate.toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
            <Text style={headerTitle}>JRM Agent Application</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Salam sejahtera {applicantName},</Text>

            <Text style={paragraph}>
              Terima kasih kerana menghantar permohonan untuk menjadi agen JRM.
              Permohonan anda telah berjaya diterima dan sedang dalam proses
              semakan.
            </Text>

            {/* Application Details Box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>Maklumat Permohonan</Text>
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>ID Permohonan:</Text>
                </Column>
                <Column>
                  <Text style={value}>{applicationId}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Nama:</Text>
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
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Tarikh Hantar:</Text>
                </Column>
                <Column>
                  <Text style={value}>{formattedDate}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              <strong>Langkah Seterusnya:</strong>
            </Text>

            <Text style={listItem}>
              • Pasukan kami akan menyemak permohonan anda dalam tempoh 3-5 hari
              bekerja
            </Text>
            <Text style={listItem}>
              • Anda akan menerima makluman email apabila status permohonan
              dikemaskini
            </Text>
            <Text style={listItem}>
              • Jika permohonan diluluskan, kami akan menghubungi anda untuk
              sesi orientasi
            </Text>

            {/* Track Application Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={trackingUrl}>
                Semak Status Permohonan
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              <strong>Perlu Bantuan?</strong>
            </Text>

            <Text style={paragraph}>
              Jika anda mempunyai sebarang pertanyaan mengenai permohonan ini,
              sila hubungi pasukan sokongan kami:
            </Text>

            <Text style={contactInfo}>
              📧 Email: support@jrm.com.my
              <br />
              📱 WhatsApp: +60 12-345 6789
              <br />
              🕒 Waktu Operasi: 9:00 AM - 6:00 PM (Isnin - Jumaat)
            </Text>

            <Text style={footer}>
              Terima kasih atas minat anda untuk menyertai keluarga besar JRM!
            </Text>

            <Text style={signature}>
              Salam hormat,
              <br />
              <strong>Pasukan JRM</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={disclaimer}>
              Email ini dihantar secara automatik. Sila jangan balas terus ke
              email ini. Untuk sebarang pertanyaan, gunakan maklumat hubungan di
              atas.
            </Text>
            <Text style={copyright}>
              © 2024 JRM Enterprise. Hak cipta terpelihara.
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
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 24px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px 0',
};

const detailsBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const detailsTitle = {
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

const listItem = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
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
  margin: '32px 0',
};

const contactInfo = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
};

const footer = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '24px 0 0 0',
};

const signature = {
  fontSize: '16px',
  color: '#374151',
  margin: '24px 0 0 0',
  lineHeight: '1.6',
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

export default ApplicationConfirmation;
