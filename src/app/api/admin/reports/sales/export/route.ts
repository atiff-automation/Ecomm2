/**

export const dynamic = 'force-dynamic';

 * Sales Export API Endpoint
 * GET /api/admin/reports/sales/export
 * Exports sales data in CSV or PDF format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { salesAnalyticsService } from '@/lib/services/sales-analytics';
import { businessProfileService } from '@/lib/receipts/business-profile-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication and authorization check
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const format = searchParams.get('format') || 'csv';
    const reportType = searchParams.get('reportType') || 'overview';

    // Validate parameters
    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { message: 'Invalid format. Must be csv or pdf' },
        { status: 400 }
      );
    }

    if (
      !['overview', 'revenue', 'products', 'customers'].includes(reportType)
    ) {
      return NextResponse.json(
        { message: 'Invalid report type' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get data based on report type
    let data: any;
    let filename: string;

    switch (reportType) {
      case 'overview':
        data = await salesAnalyticsService.getSalesOverview(startDate, endDate);
        filename = `sales-overview-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`;
        break;

      case 'revenue':
        data = await salesAnalyticsService.getRevenueAnalytics(
          startDate,
          endDate
        );
        filename = `revenue-analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`;
        break;

      case 'products':
        data = await salesAnalyticsService.getProductPerformance(
          startDate,
          endDate,
          50
        );
        filename = `product-performance-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`;
        break;

      case 'customers':
        data = await salesAnalyticsService.getCustomerInsights(
          startDate,
          endDate
        );
        filename = `customer-insights-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid report type' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      const csv = await generateCSV(data, reportType, startDate, endDate);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // PDF format
      const businessProfile =
        await businessProfileService.getLegacyCompanyInfo();
      const pdf = await generatePDF(
        data,
        reportType,
        startDate,
        endDate,
        businessProfile
      );

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error('Sales export API error:', error);
    return NextResponse.json(
      { message: 'Failed to export sales data' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV export
 */
async function generateCSV(
  data: any,
  reportType: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const formatCurrency = (amount: number) => `"RM ${amount.toFixed(2)}"`;
  const formatDate = (date: Date) => date.toLocaleDateString('en-MY');

  let csv = '';

  // Add header
  csv += `Sales Report - ${reportType.toUpperCase()}\n`;
  csv += `Period: ${formatDate(startDate)} to ${formatDate(endDate)}\n`;
  csv += `Generated: ${formatDate(new Date())}\n\n`;

  switch (reportType) {
    case 'overview':
      csv += `Metric,Value\n`;
      csv += `Total Revenue,${formatCurrency(data.totalRevenue)}\n`;
      csv += `Total Orders,"${data.totalOrders}"\n`;
      csv += `Average Order Value,${formatCurrency(data.averageOrderValue)}\n`;
      csv += `Member Revenue,${formatCurrency(data.memberRevenue)}\n`;
      csv += `Non-Member Revenue,${formatCurrency(data.nonMemberRevenue)}\n`;
      csv += `Tax Collected,${formatCurrency(data.taxCollected)}\n`;
      break;

    case 'products':
      csv += `Rank,Product Name,SKU,Quantity Sold,Total Revenue,Profit Margin,Member Sales,Non-Member Sales\n`;
      data.forEach((product: any, index: number) => {
        csv += `"${index + 1}","${product.productName}","${product.sku}","${product.totalQuantitySold}",${formatCurrency(product.totalRevenue)},${formatCurrency(product.profitMargin)},${formatCurrency(product.memberSales)},${formatCurrency(product.nonMemberSales)}\n`;
      });
      break;

    case 'customers':
      csv += `Metric,Value\n`;
      csv += `Total Customers,"${data.totalCustomers}"\n`;
      csv += `New Customers,"${data.newCustomers}"\n`;
      csv += `Returning Customers,"${data.returningCustomers}"\n`;
      csv += `Member Conversion Rate,"${data.memberConversionRate.toFixed(1)}%"\n`;
      csv += `Average Customer Lifetime Value,${formatCurrency(data.avgCustomerLifetimeValue)}\n\n`;

      if (data.topStates && data.topStates.length > 0) {
        csv += `\nTop States by Revenue\n`;
        csv += `Rank,State,State Name,Total Orders,Total Revenue\n`;
        data.topStates.forEach((state: any, index: number) => {
          csv += `"${index + 1}","${state.state}","${state.stateName}","${state.totalOrders}",${formatCurrency(state.totalRevenue)}\n`;
        });
      }
      break;

    case 'revenue':
      csv += `Payment Method Analytics\n`;
      csv += `Method,Count,Revenue,Percentage\n`;
      data.paymentMethods.forEach((method: any) => {
        csv += `"${method.method}","${method.count}",${formatCurrency(method.revenue)},"${method.percentage.toFixed(1)}%"\n`;
      });

      csv += `\nDaily Revenue Data\n`;
      csv += `Date,Revenue,Orders,Member Revenue,Non-Member Revenue\n`;
      data.daily.forEach((point: any) => {
        csv += `"${point.date}",${formatCurrency(point.revenue)},"${point.orders}",${formatCurrency(point.memberRevenue)},${formatCurrency(point.nonMemberRevenue)}\n`;
      });
      break;
  }

  return csv;
}

/**
 * Generate PDF export (simplified version)
 * In production, you'd use a library like jsPDF or Puppeteer
 */
async function generatePDF(
  data: any,
  reportType: string,
  startDate: Date,
  endDate: Date,
  businessProfile: any
): Promise<Buffer> {
  // For now, return a simple text-based PDF
  // In production, implement proper PDF generation
  const content = `
    Sales Report - ${reportType.toUpperCase()}
    ${businessProfile.name}
    
    Period: ${startDate.toLocaleDateString('en-MY')} to ${endDate.toLocaleDateString('en-MY')}
    Generated: ${new Date().toLocaleDateString('en-MY')}
    
    Malaysian E-commerce Platform
    Tax Registration: ${businessProfile.sstNo}
    
    ${JSON.stringify(data, null, 2)}
  `;

  // Return as buffer (in production, generate proper PDF)
  return Buffer.from(content, 'utf-8');
}
