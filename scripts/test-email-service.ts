/**
 * Email Service Integration Test
 * Tests the actual email delivery service with agent application emails
 */

import { AgentApplicationService } from '../src/lib/services/agent-application.service';
import { emailService } from '../src/lib/email/email-service';

// Test data
const testApplicationData = {
  applicationId: 'test_app_001',
  applicantName: 'Ahmad Test User',
  applicantEmail: 'claude.test@tempmail.org', // Using a test email
  submissionDate: new Date(),
  reviewedDate: new Date(),
  applicantDetails: {
    phoneNumber: '+60 12-345 6789',
    age: 30,
    businessLocation: 'Kuala Lumpur',
    hasBusinessExp: true,
    hasJrmExp: false
  }
};

async function testEmailDelivery() {
  console.log('🧪 Testing Agent Application Email Service Integration...\n');

  try {
    // Test 1: Application Confirmation Email
    console.log('📧 Testing Application Confirmation Email delivery...');

    try {
      await emailService.sendAgentApplicationConfirmation({
        applicationId: testApplicationData.applicationId,
        applicantName: testApplicationData.applicantName,
        applicantEmail: testApplicationData.applicantEmail,
        submissionDate: testApplicationData.submissionDate
      });
      console.log('✅ Application Confirmation Email sent successfully');
    } catch (error) {
      console.log('❌ Application Confirmation Email failed:', error.message);
    }

    // Test 2: Admin Notification Email
    console.log('\n📧 Testing Admin Notification Email delivery...');

    try {
      await emailService.notifyAdminsOfNewAgentApplication({
        applicationId: testApplicationData.applicationId,
        applicantName: testApplicationData.applicantName,
        applicantEmail: testApplicationData.applicantEmail,
        submissionDate: testApplicationData.submissionDate,
        applicantDetails: testApplicationData.applicantDetails
      });
      console.log('✅ Admin Notification Email sent successfully');
    } catch (error) {
      console.log('❌ Admin Notification Email failed:', error.message);
    }

    // Test 3: Status Update Emails
    const statuses = ['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFO'] as const;

    for (const status of statuses) {
      console.log(`\n📧 Testing Status Update Email - ${status}...`);

      try {
        await emailService.sendAgentApplicationStatusUpdate({
          applicationId: testApplicationData.applicationId,
          applicantName: testApplicationData.applicantName,
          applicantEmail: testApplicationData.applicantEmail,
          status: status,
          reviewedDate: testApplicationData.reviewedDate,
          adminNotes: getTestNotes(status)
        });
        console.log(`✅ Status Update Email (${status}) sent successfully`);
      } catch (error) {
        console.log(`❌ Status Update Email (${status}) failed:`, error.message);
      }
    }

    console.log('\n🎉 Email service integration testing completed!');
    console.log('📝 Check the test email inbox to verify email content and formatting.');

  } catch (error) {
    console.error('💥 Email service testing failed:', error);
    throw error;
  }
}

function getTestNotes(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Tahniah! Permohonan anda telah diluluskan. Pasukan kami akan menghubungi anda tidak lama lagi.';
    case 'REJECTED':
      return 'Terima kasih atas minat anda. Permohonan tidak dapat diteruskan pada masa ini kerana kriteria yang ditetapkan.';
    case 'UNDER_REVIEW':
      return 'Permohonan anda sedang dalam semakan mendalam. Kami akan memberitahu anda dengan keputusan tidak lama lagi.';
    case 'NEEDS_MORE_INFO':
      return 'Kami memerlukan maklumat tambahan mengenai pengalaman perniagaan anda untuk melengkapkan semakan.';
    default:
      return 'Status permohonan anda telah dikemaskini.';
  }
}

// Service method validation test
async function testServiceMethods() {
  console.log('\n🔍 Testing Agent Application Service Email Methods...\n');

  // Mock application data for service testing
  const mockApplication = {
    id: 'mock_app_001',
    email: 'test.service@tempmail.org',
    fullName: 'Service Test User',
    phoneNumber: '+60 12-987 6543',
    age: 25,
    hasBusinessExp: true,
    hasJrmExp: false,
    businessLocation: 'Petaling Jaya',
    submittedAt: new Date(),
    reviewedAt: new Date(),
    status: 'SUBMITTED' as const
  };

  try {
    // Test service method for sending confirmation
    console.log('📧 Testing AgentApplicationService.sendConfirmationEmail...');

    // Note: This would normally be called by the service after application creation
    // For testing, we'll check if the method exists and is callable
    if (typeof AgentApplicationService.sendConfirmationEmail === 'function') {
      console.log('✅ sendConfirmationEmail method exists');
    } else {
      console.log('❌ sendConfirmationEmail method not found');
    }

    // Test service method for admin notification
    console.log('📧 Testing AgentApplicationService.notifyAdminsOfNewApplication...');

    if (typeof AgentApplicationService.notifyAdminsOfNewApplication === 'function') {
      console.log('✅ notifyAdminsOfNewApplication method exists');
    } else {
      console.log('❌ notifyAdminsOfNewApplication method not found');
    }

    // Test service method for status updates
    console.log('📧 Testing AgentApplicationService.sendStatusUpdateEmail...');

    if (typeof AgentApplicationService.sendStatusUpdateEmail === 'function') {
      console.log('✅ sendStatusUpdateEmail method exists');
    } else {
      console.log('❌ sendStatusUpdateEmail method not found');
    }

    console.log('\n✅ Service method validation completed');

  } catch (error) {
    console.error('❌ Service method testing failed:', error);
  }
}

// Configuration validation test
function testEmailConfiguration() {
  console.log('\n⚙️ Testing Email Service Configuration...\n');

  try {
    // Check if email service is properly configured
    if (emailService) {
      console.log('✅ Email service instance available');
    } else {
      console.log('❌ Email service instance not available');
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'RESEND_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is configured`);
      } else {
        console.log(`❌ ${envVar} is missing`);
      }
    }

    console.log('\n✅ Configuration validation completed');

  } catch (error) {
    console.error('❌ Configuration testing failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Agent Application Email Service Tests\n');

  try {
    // Test 1: Configuration validation
    testEmailConfiguration();

    // Test 2: Service methods validation
    await testServiceMethods();

    // Test 3: Email delivery (only if email service is configured)
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key') {
      console.log('\n🔗 Email service is configured, testing delivery...');
      await testEmailDelivery();
    } else {
      console.log('\n⚠️  Email service not fully configured, skipping delivery tests');
      console.log('   To test email delivery:');
      console.log('   1. Set RESEND_API_KEY in your environment');
      console.log('   2. Configure a test email address');
      console.log('   3. Run this script again');
    }

    console.log('\n✨ All email service tests completed!');

  } catch (error) {
    console.error('💥 Email service testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testEmailDelivery, testServiceMethods, testEmailConfiguration };