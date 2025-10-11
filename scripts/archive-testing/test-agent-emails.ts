/**
 * Agent Application Email Testing Script
 * Tests all email templates with realistic data
 */

import React from 'react';
import { render } from '@react-email/render';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Import all email templates
import { ApplicationConfirmation } from '../src/components/emails/agent-application/ApplicationConfirmation';
import { AdminNotification } from '../src/components/emails/agent-application/AdminNotification';
import { StatusUpdate } from '../src/components/emails/agent-application/StatusUpdate';

// Test data
const testData = {
  applicationId: 'app_2024_001',
  applicantName: 'Ahmad Bin Abdullah',
  applicantEmail: 'ahmad.abdullah@email.com',
  submissionDate: new Date('2024-01-15T10:30:00Z'),
  reviewedDate: new Date('2024-01-18T14:45:00Z'),
  applicantDetails: {
    phoneNumber: '+60 12-345 6789',
    age: 28,
    businessLocation: 'Kuala Lumpur',
    hasBusinessExp: true,
    hasJrmExp: false
  }
};

async function generateEmailPreviews() {
  console.log('🧪 Generating email template previews...');

  // Create output directory
  const outputDir = join(process.cwd(), 'email-previews');
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  try {
    // Test 1: Application Confirmation Email
    console.log('📧 Testing Application Confirmation Email...');
    const confirmationHtml = await render(ApplicationConfirmation({
      applicationId: testData.applicationId,
      applicantName: testData.applicantName,
      applicantEmail: testData.applicantEmail,
      submissionDate: testData.submissionDate
    }));

    writeFileSync(
      join(outputDir, 'application-confirmation.html'),
      confirmationHtml
    );
    console.log('✅ Application Confirmation Email generated');

    // Test 2: Admin Notification Email
    console.log('📧 Testing Admin Notification Email...');
    const adminNotificationHtml = await render(AdminNotification({
      applicationId: testData.applicationId,
      applicantName: testData.applicantName,
      applicantEmail: testData.applicantEmail,
      submissionDate: testData.submissionDate,
      applicantDetails: testData.applicantDetails
    }));

    writeFileSync(
      join(outputDir, 'admin-notification.html'),
      adminNotificationHtml
    );
    console.log('✅ Admin Notification Email generated');

    // Test 3: Status Update Emails (all statuses)
    const statuses = ['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFO'] as const;

    for (const status of statuses) {
      console.log(`📧 Testing Status Update Email - ${status}...`);

      const statusUpdateHtml = await render(StatusUpdate({
        applicationId: testData.applicationId,
        applicantName: testData.applicantName,
        applicantEmail: testData.applicantEmail,
        status: status,
        reviewedDate: testData.reviewedDate,
        adminNotes: getStatusNotes(status),
        nextSteps: getStatusSteps(status)
      }));

      writeFileSync(
        join(outputDir, `status-update-${status.toLowerCase()}.html`),
        statusUpdateHtml
      );
      console.log(`✅ Status Update Email (${status}) generated`);
    }

    // Test 4: Email with Custom Notes and Steps
    console.log('📧 Testing Custom Status Update Email...');
    const customStatusHtml = await render(StatusUpdate({
      applicationId: testData.applicationId,
      applicantName: testData.applicantName,
      applicantEmail: testData.applicantEmail,
      status: 'NEEDS_MORE_INFO',
      reviewedDate: testData.reviewedDate,
      adminNotes: 'Kami memerlukan maklumat tambahan mengenai pengalaman perniagaan anda. Sila sertakan butiran tentang jenis perniagaan yang pernah anda jalankan dan berapa lama pengalaman tersebut.',
      nextSteps: [
        'Sila hantar dokumen sijil perniagaan (jika ada)',
        'Berikan butiran pengalaman perniagaan selama 3-5 tahun yang lalu',
        'Nyatakan jenis produk yang pernah dijual secara online',
        'Hantar maklumat tambahan dalam tempoh 5 hari bekerja'
      ],
      contactInfo: {
        email: 'agent-support@jrm.com.my',
        phone: '+60 3-1234 5678',
        whatsapp: '+60 12-345 6789'
      }
    }));

    writeFileSync(
      join(outputDir, 'status-update-custom.html'),
      customStatusHtml
    );
    console.log('✅ Custom Status Update Email generated');

    console.log('\n🎉 All email templates generated successfully!');
    console.log(`📁 Preview files saved in: ${outputDir}`);
    console.log('\n📋 Generated files:');
    console.log('   • application-confirmation.html');
    console.log('   • admin-notification.html');
    console.log('   • status-update-approved.html');
    console.log('   • status-update-rejected.html');
    console.log('   • status-update-under_review.html');
    console.log('   • status-update-needs_more_info.html');
    console.log('   • status-update-custom.html');

    return true;
  } catch (error) {
    console.error('❌ Email generation failed:', error);
    throw error;
  }
}

function getStatusNotes(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Tahniah! Anda telah memenuhi semua kriteria untuk menjadi agen JRM. Pasukan kami akan menghubungi anda untuk proses onboarding.';
    case 'REJECTED':
      return 'Terima kasih atas minat anda. Setelah semakan teliti, kami dapati permohonan tidak memenuhi kriteria pada masa ini. Anda dialu-alukan untuk memohon semula selepas 6 bulan.';
    case 'UNDER_REVIEW':
      return 'Permohonan anda sedang dalam semakan mendalam. Kami akan menghubungi anda jika memerlukan maklumat tambahan.';
    case 'NEEDS_MORE_INFO':
      return 'Kami memerlukan beberapa maklumat tambahan untuk melengkapkan semakan permohonan anda.';
    default:
      return 'Status permohonan anda telah dikemaskini.';
  }
}

function getStatusSteps(status: string): string[] {
  switch (status) {
    case 'APPROVED':
      return [
        'Tunggu panggilan dari pasukan kami dalam 1-2 hari bekerja',
        'Sediakan dokumen pengenalan untuk pendaftaran',
        'Hadiri sesi orientasi yang akan dijadualkan',
        'Terima kit permulaan agen JRM'
      ];
    case 'REJECTED':
      return [
        'Pertimbangkan untuk menambah pengalaman dalam bidang berkaitan',
        'Anda boleh memohon semula selepas 6 bulan',
        'Hubungi kami jika ada pertanyaan mengenai keputusan ini'
      ];
    case 'UNDER_REVIEW':
      return [
        'Tiada tindakan diperlukan dari anda pada masa ini',
        'Keputusan akan dimaklumkan dalam 3-5 hari bekerja',
        'Kami akan menghubungi anda jika diperlukan maklumat tambahan'
      ];
    case 'NEEDS_MORE_INFO':
      return [
        'Semak nota dari pasukan kami di atas',
        'Kemaskini permohonan dengan maklumat yang diminta',
        'Hantar maklumat tambahan dalam tempoh yang ditetapkan'
      ];
    default:
      return ['Semak portal untuk maklumat terkini'];
  }
}

// Template validation function
async function validateEmailTemplates() {
  console.log('🔍 Validating email template structure...');

  const validationTests = [
    {
      name: 'Application Confirmation Structure',
      test: async () => {
        const html = await render(ApplicationConfirmation({
          applicationId: 'test-123',
          applicantName: 'Test User',
          applicantEmail: 'test@example.com',
          submissionDate: new Date()
        }));

        return html.includes('Terima kasih kerana menghantar permohonan') &&
               html.includes('test-123') &&
               html.includes('Test User');
      }
    },
    {
      name: 'Admin Notification Structure',
      test: async () => {
        const html = await render(AdminNotification({
          applicationId: 'test-123',
          applicantName: 'Test User',
          applicantEmail: 'test@example.com',
          submissionDate: new Date()
        }));

        return html.includes('New Agent Application') &&
               html.includes('Review Application') &&
               html.includes('test-123');
      }
    },
    {
      name: 'Status Update APPROVED',
      test: async () => {
        const html = await render(StatusUpdate({
          applicationId: 'test-123',
          applicantName: 'Test User',
          applicantEmail: 'test@example.com',
          status: 'APPROVED',
          reviewedDate: new Date()
        }));

        return html.includes('Permohonan Diluluskan') &&
               html.includes('DILULUSKAN');
      }
    },
    {
      name: 'Status Update REJECTED',
      test: async () => {
        const html = await render(StatusUpdate({
          applicationId: 'test-123',
          applicantName: 'Test User',
          applicantEmail: 'test@example.com',
          status: 'REJECTED',
          reviewedDate: new Date()
        }));

        return html.includes('TIDAK DILULUSKAN');
      }
    }
  ];

  let passedTests = 0;

  for (const test of validationTests) {
    try {
      if (await test.test()) {
        console.log(`✅ ${test.name} - PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }

  console.log(`\n📊 Validation Results: ${passedTests}/${validationTests.length} tests passed`);
  return passedTests === validationTests.length;
}

// Main execution
async function main() {
  console.log('🚀 Starting Agent Application Email Tests\n');

  try {
    // Validate templates
    const validationPassed = await validateEmailTemplates();

    if (!validationPassed) {
      console.error('❌ Template validation failed. Please fix issues before proceeding.');
      process.exit(1);
    }

    console.log('\n');

    // Generate previews
    await generateEmailPreviews();

    console.log('\n✨ Email testing completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Open generated HTML files in browser to review visual styling');
    console.log('   2. Test actual email delivery using email service');
    console.log('   3. Verify all links and tracking parameters work correctly');

  } catch (error) {
    console.error('💥 Email testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateEmailPreviews, validateEmailTemplates };