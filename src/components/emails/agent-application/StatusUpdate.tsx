/**
 * Application Status Update Email Template
 * Sent to applicants when their application status changes
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

interface StatusUpdateProps {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'NEEDS_MORE_INFO';
  adminNotes?: string;
  reviewedDate: Date;
  nextSteps?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
}

export const StatusUpdate = ({
  applicationId,
  applicantName,
  applicantEmail,
  status,
  adminNotes,
  reviewedDate,
  nextSteps,
  contactInfo = {
    email: 'support@jrm.com.my',
    phone: '+60 12-345 6789',
    whatsapp: '+60 12-345 6789'
  }
}: StatusUpdateProps) => {
  const formattedDate = reviewedDate.toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          title: 'Permohonan Diluluskan! 🎉',
          message: 'Tahniah! Permohonan anda untuk menjadi agen JRM telah diluluskan.',
          color: '#059669',
          backgroundColor: '#ecfdf5',
          borderColor: '#10b981',
          icon: '✅',
          actionText: 'Mula Sebagai Agen'
        };
      case 'REJECTED':
        return {
          title: 'Update Status Permohonan',
          message: 'Terima kasih atas minat anda. Setelah semakan teliti, kami tidak dapat meneruskan permohonan anda pada masa ini.',
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          icon: '❌',
          actionText: 'Mohon Semula'
        };
      case 'UNDER_REVIEW':
        return {
          title: 'Permohonan Dalam Semakan',
          message: 'Permohonan anda sedang dalam proses semakan mendalam oleh pasukan kami.',
          color: '#d97706',
          backgroundColor: '#fffbeb',
          borderColor: '#f59e0b',
          icon: '⏳',
          actionText: 'Semak Status'
        };
      case 'NEEDS_MORE_INFO':
        return {
          title: 'Maklumat Tambahan Diperlukan',
          message: 'Kami memerlukan maklumat tambahan untuk melengkapkan semakan permohonan anda.',
          color: '#2563eb',
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          icon: '📋',
          actionText: 'Kemaskini Permohonan'
        };
      default:
        return {
          title: 'Update Status Permohonan',
          message: 'Status permohonan anda telah dikemaskini.',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderColor: '#9ca3af',
          icon: '📄',
          actionText: 'Lihat Permohonan'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

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
            {/* Status Banner */}
            <Section style={{
              ...statusBanner,
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
              color: statusConfig.color
            }}>
              <Text style={statusIcon}>{statusConfig.icon}</Text>
              <Text style={statusTitle}>{statusConfig.title}</Text>
            </Section>

            <Text style={greeting}>
              Salam sejahtera {applicantName},
            </Text>

            <Text style={paragraph}>
              {statusConfig.message}
            </Text>

            {/* Application Details */}
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
                  <Text style={label}>Status Terkini:</Text>
                </Column>
                <Column>
                  <Text style={{
                    ...statusValue,
                    color: statusConfig.color
                  }}>
                    {status === 'APPROVED' && 'DILULUSKAN'}
                    {status === 'REJECTED' && 'TIDAK DILULUSKAN'}
                    {status === 'UNDER_REVIEW' && 'DALAM SEMAKAN'}
                    {status === 'NEEDS_MORE_INFO' && 'PERLU MAKLUMAT TAMBAHAN'}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column style={labelColumn}>
                  <Text style={label}>Tarikh Semakan:</Text>
                </Column>
                <Column>
                  <Text style={value}>{formattedDate}</Text>
                </Column>
              </Row>
            </Section>

            {/* Admin Notes */}
            {adminNotes && (
              <Section style={notesBox}>
                <Text style={notesTitle}>Nota dari Pasukan Kami</Text>
                <Text style={notesContent}>{adminNotes}</Text>
              </Section>
            )}

            {/* Next Steps */}
            {nextSteps && nextSteps.length > 0 && (
              <Section style={stepsBox}>
                <Text style={stepsTitle}>Langkah Seterusnya</Text>
                {nextSteps.map((step, index) => (
                  <Text key={index} style={stepItem}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </Section>
            )}

            {/* Default Next Steps by Status */}
            {!nextSteps && (
              <Section style={stepsBox}>
                <Text style={stepsTitle}>Langkah Seterusnya</Text>
                {status === 'APPROVED' && (
                  <>
                    <Text style={stepItem}>1. Kami akan menghubungi anda dalam tempoh 1-2 hari bekerja</Text>
                    <Text style={stepItem}>2. Sesi orientasi dan latihan akan dijadualkan</Text>
                    <Text style={stepItem}>3. Anda akan menerima kit permulaan agen JRM</Text>
                    <Text style={stepItem}>4. Mula perjalanan sebagai agen JRM bersertifikat</Text>
                  </>
                )}
                {status === 'REJECTED' && (
                  <>
                    <Text style={stepItem}>1. Anda boleh memohon semula selepas 6 bulan</Text>
                    <Text style={stepItem}>2. Pertimbangkan untuk menambah pengalaman dalam bidang berkaitan</Text>
                    <Text style={stepItem}>3. Hubungi kami jika ada pertanyaan mengenai keputusan ini</Text>
                  </>
                )}
                {status === 'UNDER_REVIEW' && (
                  <>
                    <Text style={stepItem}>1. Tiada tindakan diperlukan dari anda pada masa ini</Text>
                    <Text style={stepItem}>2. Kami akan menghubungi anda jika diperlukan maklumat tambahan</Text>
                    <Text style={stepItem}>3. Keputusan akhir akan dimaklumkan dalam tempoh 5-7 hari bekerja</Text>
                  </>
                )}
                {status === 'NEEDS_MORE_INFO' && (
                  <>
                    <Text style={stepItem}>1. Sila semak nota dari pasukan kami di atas</Text>
                    <Text style={stepItem}>2. Kemaskini permohonan anda dengan maklumat yang diminta</Text>
                    <Text style={stepItem}>3. Hantar maklumat tambahan dalam tempoh 7 hari</Text>
                  </>
                )}
              </Section>
            )}

            {/* Action Button */}
            <Section style={buttonContainer}>
              <Button
                style={{
                  ...actionButton,
                  backgroundColor: statusConfig.color
                }}
                href={`${process.env.NEXTAUTH_URL}/apply-agent/status?id=${applicationId}`}
              >
                {statusConfig.actionText}
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Contact Information */}
            <Text style={contactTitle}>Perlu Bantuan?</Text>
            <Text style={paragraph}>
              Jika anda mempunyai sebarang pertanyaan mengenai status permohonan ini,
              jangan teragak-agak untuk menghubungi kami:
            </Text>

            <Text style={contactInfo}>
              📧 Email: {contactInfo.email}<br />
              📱 Telefon: {contactInfo.phone}<br />
              💬 WhatsApp: {contactInfo.whatsapp}<br />
              🕒 Waktu Operasi: 9:00 AM - 6:00 PM (Isnin - Jumaat)
            </Text>

            <Text style={signature}>
              Terima kasih atas kesabaran anda.<br />
              <strong>Pasukan JRM</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={disclaimer}>
              Email ini dihantar secara automatik. Untuk sebarang pertanyaan,
              gunakan maklumat hubungan yang disediakan.
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

const statusBanner = {
  border: '2px solid',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const statusIcon = {
  fontSize: '48px',
  margin: '0 0 8px 0',
};

const statusTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
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

const statusValue = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const notesBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const notesTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px 0',
};

const notesContent = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#78350f',
  margin: '0',
  fontStyle: 'italic',
};

const stepsBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const stepsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const stepItem = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const actionButton = {
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

const contactTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
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

export default StatusUpdate;