import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test if we can query orders with the new fields
    const orders = await prisma.order.findMany({
      take: 1,
      select: {
        id: true,
        orderNumber: true,
        paymentId: true,
        toyyibpayBillCode: true,
        toyyibpayPaymentUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Prisma client can access ToyyibPay fields',
      orders,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to access ToyyibPay fields',
    }, { status: 500 });
  }
}