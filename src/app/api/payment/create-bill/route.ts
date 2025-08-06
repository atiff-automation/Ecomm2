/**
 * Payment Bill Creation API
 * Creates Billplz payment bills for order processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { billplzService } from '@/lib/payments/billplz-service';
import { malaysianTaxService } from '@/lib/tax/malaysian-tax';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const createBillSchema = z.object({
  cartItems: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ),
  customerInfo: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Malaysia'),
  }),
  appliedDiscounts: z
    .array(
      z.object({
        code: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
  membershipDiscount: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBillSchema.parse(body);

    const {
      cartItems,
      customerInfo,
      shippingAddress,
      appliedDiscounts,
      membershipDiscount,
    } = validatedData;

    // Get session (optional for guest checkout)
    const session = await getServerSession(authOptions);

    // Check if Billplz service is configured
    if (!billplzService.isConfigured()) {
      return NextResponse.json(
        {
          message: 'Payment service is not properly configured',
          debug: billplzService.getConfigStatus(),
        },
        { status: 500 }
      );
    }

    // Get product details and validate availability
    const productIds = cartItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
    });

    if (products.length !== cartItems.length) {
      return NextResponse.json(
        { message: 'Some products are no longer available' },
        { status: 400 }
      );
    }

    // Check stock availability
    const stockErrors: string[] = [];
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (product && product.stockQuantity < cartItem.quantity) {
        stockErrors.push(
          `${product.name}: Only ${product.stockQuantity} items available (requested ${cartItem.quantity})`
        );
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        {
          message: 'Insufficient stock',
          errors: stockErrors,
        },
        { status: 400 }
      );
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = cartItems.map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId)!;
      const price = session?.user?.isMember
        ? Number(product.memberPrice)
        : Number(product.regularPrice);
      const itemTotal = price * cartItem.quantity;
      subtotal += itemTotal;

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: cartItem.quantity,
        regularPrice: Number(product.regularPrice),
        memberPrice: Number(product.memberPrice),
        appliedPrice: price,
        totalPrice: itemTotal,
      };
    });

    // Calculate tax
    const taxProducts = orderItems.map(item => ({
      id: item.productId,
      name: item.productName,
      price: item.appliedPrice,
      quantity: item.quantity,
      taxCategory: 'STANDARD' as const,
      isGstApplicable: false, // GST is suspended in Malaysia
      isSstApplicable: true, // SST is currently active
    }));

    const taxCalculation = await malaysianTaxService.calculateTax(taxProducts);

    // Calculate discounts
    const discountAmount = (appliedDiscounts || []).reduce(
      (sum, discount) => sum + discount.amount,
      0
    );
    const memberDiscountAmount = membershipDiscount || 0;
    const totalDiscounts = discountAmount + memberDiscountAmount;

    // Calculate shipping using EasyParcel integration
    const { shippingCalculator } = await import(
      '@/lib/shipping/shipping-calculator'
    );

    // Prepare items for shipping calculation
    const shippingItems = orderItems.map((item, index) => {
      const product = products[index];
      return {
        productId: item.productId,
        name: item.productName,
        weight: product.weight ? Number(product.weight) : 0.5, // Default 0.5kg if no weight
        quantity: item.quantity,
        value: item.appliedPrice,
      };
    });

    // Calculate shipping cost
    const shippingCost = await shippingCalculator.getCheapestShippingRate(
      shippingItems,
      shippingAddress,
      subtotal
    );

    // Calculate final total
    const finalTotal =
      subtotal + taxCalculation.taxAmount + shippingCost - totalDiscounts;

    if (finalTotal <= 0) {
      return NextResponse.json(
        { message: 'Order total cannot be zero or negative' },
        { status: 400 }
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create Billplz bill
    const billData = {
      collection_id: billplzService.generateCollectionId(),
      description: `JRM E-commerce Order ${orderNumber}`,
      email: customerInfo.email,
      name: customerInfo.name,
      amount: finalTotal, // Amount in RM (Billplz service will convert to cents)
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      reference_1_label: 'Order Number',
      reference_1: orderNumber,
      reference_2_label: 'Customer Email',
      reference_2: customerInfo.email,
    };

    const paymentResult = await billplzService.createBill(billData);

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          message: 'Failed to create payment bill',
          error: paymentResult.error,
        },
        { status: 500 }
      );
    }

    // Create order in database (initially as PENDING)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        taxAmount: taxCalculation.taxAmount,
        shippingCost,
        discountAmount: totalDiscounts,
        total: finalTotal,
        memberDiscount: memberDiscountAmount,
        wasEligibleForMembership: !!session?.user?.isMember,
        paymentMethod: 'BILLPLZ',
        paymentId: paymentResult.bill_id,
        customerNotes: `Payment via Billplz. Bill ID: ${paymentResult.bill_id}`,

        // Create order items
        orderItems: {
          create: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            regularPrice: item.regularPrice,
            memberPrice: item.memberPrice,
            appliedPrice: item.appliedPrice,
            totalPrice: item.totalPrice,
            productName: item.productName,
            productSku: item.productSku,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Log the payment creation
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || null,
        action: 'PAYMENT_BILL_CREATED',
        resource: 'ORDER',
        resourceId: order.id,
        details: {
          orderNumber,
          billplzBillId: paymentResult.bill_id,
          amount: finalTotal,
          paymentUrl: paymentResult.payment_url,
          customerEmail: customerInfo.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: finalTotal,
        taxBreakdown: taxCalculation.breakdown,
      },
      payment: {
        billId: paymentResult.bill_id,
        paymentUrl: paymentResult.payment_url,
        amount: billplzService.formatAmount(finalTotal * 100), // Convert back to display format
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Payment bill creation error:', error);
    return handleApiError(error);
  }
}
