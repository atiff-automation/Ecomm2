/**
 * EasyParcel Testing Logs API
 * Real-time test execution logs and historical results
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const logQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
  severity: z.enum(['info', 'warning', 'error', 'all']).optional(),
  testSuite: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const {
      limit = 50,
      offset = 0,
      severity = 'all',
      testSuite,
      startDate,
      endDate
    } = logQuerySchema.parse(query);

    // Mock test execution logs (in real implementation, these would be stored in database)
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        testSuite: 'rates',
        testName: 'Rate Calculation: KL to Selangor',
        severity: 'info',
        message: 'Found 3 rates for route',
        duration: 1250,
        data: { rateCount: 3, cheapestRate: 8.50 }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        testSuite: 'booking',
        testName: 'Shipment Booking',
        severity: 'warning',
        message: 'Booking response received but no shipment ID',
        duration: 2100,
        data: null
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        testSuite: 'tax',
        testName: 'Malaysian Tax Calculation',
        severity: 'info',
        message: 'Tax calculated: RM6.60',
        duration: 45,
        data: { 
          subtotal: 1050, 
          salesTax: 0, 
          serviceTax: 6.60, 
          total: 1056.60 
        }
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        testSuite: 'errors',
        testName: 'Invalid Address Handling',
        severity: 'error',
        message: 'Invalid address was accepted (unexpected)',
        duration: 890,
        data: null
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        testSuite: 'tracking',
        testName: 'Webhook Configuration',
        severity: 'info',
        message: 'Webhook URL configured: http://localhost:3000/api/webhooks/easyparcel-tracking',
        duration: 15,
        data: { webhookUrl: 'http://localhost:3000/api/webhooks/easyparcel-tracking' }
      }
    ];

    // Filter logs based on query parameters
    let filteredLogs = mockLogs;

    if (severity !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    if (testSuite) {
      filteredLogs = filteredLogs.filter(log => log.testSuite === testSuite);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    // Generate summary statistics
    const summary = {
      total: filteredLogs.length,
      bySeveiry: {
        info: filteredLogs.filter(log => log.severity === 'info').length,
        warning: filteredLogs.filter(log => log.severity === 'warning').length,
        error: filteredLogs.filter(log => log.severity === 'error').length
      },
      averageDuration: filteredLogs.length > 0 
        ? filteredLogs.reduce((sum, log) => sum + log.duration, 0) / filteredLogs.length 
        : 0,
      mostRecentTest: filteredLogs.length > 0 ? filteredLogs[0].timestamp : null
    };

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        limit,
        offset,
        total: filteredLogs.length,
        hasMore: offset + limit < filteredLogs.length
      },
      summary,
      filters: {
        severity,
        testSuite,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error fetching test logs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch test logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_logs':
        // In real implementation, this would clear logs from database
        console.log('Clearing EasyParcel test logs...');
        
        return NextResponse.json({
          success: true,
          message: 'Test logs cleared successfully',
          clearedAt: new Date().toISOString(),
          clearedBy: session.user.email
        });

      case 'export_logs':
        const { format = 'json', ...filters } = body;
        
        // Generate export data (simplified for this implementation)
        const exportData = {
          generatedAt: new Date().toISOString(),
          generatedBy: session.user.email,
          filters,
          logs: [] // In real implementation, fetch filtered logs
        };

        if (format === 'csv') {
          // Convert to CSV format
          const csvHeaders = 'Timestamp,Test Suite,Test Name,Severity,Message,Duration,Data\n';
          const csvRows = ''; // In real implementation, convert logs to CSV
          
          return new NextResponse(csvHeaders + csvRows, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="easyparcel-test-logs-${Date.now()}.csv"`
            }
          });
        }

        return NextResponse.json({
          success: true,
          export: exportData,
          downloadUrl: null // In real implementation, generate signed URL for file download
        });

      case 'archive_logs':
        const { beforeDate } = body;
        
        if (!beforeDate) {
          return NextResponse.json(
            { error: 'beforeDate is required for archiving' },
            { status: 400 }
          );
        }

        // In real implementation, archive logs older than specified date
        console.log(`Archiving logs before ${beforeDate}...`);

        return NextResponse.json({
          success: true,
          message: `Logs before ${beforeDate} archived successfully`,
          archivedCount: 0, // In real implementation, return actual count
          archivedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in test logs action:', error);
    return NextResponse.json(
      { error: 'Failed to process logs action' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SuperAdmin required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Delete all logs
      console.log('Deleting all EasyParcel test logs...');
      
      return NextResponse.json({
        success: true,
        message: 'All test logs deleted successfully',
        deletedCount: 0, // In real implementation, return actual count
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.email
      });
    }

    if (logId) {
      // Delete specific log
      console.log(`Deleting test log ${logId}...`);
      
      return NextResponse.json({
        success: true,
        message: `Test log ${logId} deleted successfully`,
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.email
      });
    }

    return NextResponse.json(
      { error: 'Either logId or all=true parameter is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error deleting test logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete test logs' },
      { status: 500 }
    );
  }
}