/**

export const dynamic = 'force-dynamic';

 * Orders API - Malaysian E-commerce Platform
 * Handle order creation and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getMembershipConfig } from '@/lib/membership';
// import { activateUserMembership } from '@/lib/membership'; // Not used in current flow
import { z } from 'zod';
import { getGuestCart, clearGuestCart } from '@/lib/cart/guest-cart';
import { getBestPrice } from '@/lib/promotions/promotion-utils';
// import { MalaysianTaxService, ServiceTaxCategory } from '@/lib/tax/malaysian-tax-service'; // Disabled - tax not configured yet
// TODO: Restore shipping config after new simple implementation
// import { businessShippingConfig } from '@/lib/config/business-shipping-config';

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  country: z.string().default('MY'),
});

const createOrderSchema = z.object({
  cartItems: z.array(orderItemSchema).optional(), // Optional for authenticated users (use cart)
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.enum(['toyyibpay', 'TOYYIBPAY']),
  orderNotes: z.string().optional(),
  membershipActivated: z.boolean().optional(),
  isGuest: z.boolean().optional(), // To indicate guest checkout
  guestEmail: z.string().email().optional(), // Guest email for order tracking
  // New simplified shipping implementation
  selectedShipping: z
    .object({
      serviceId: z.string(),
      courierName: z.string(),
      serviceType: z.string(), // 'parcel' or 'document'
      serviceDetail: z.string(), // 'pickup', 'dropoff', or 'dropoff or pickup'
      cost: z.number(),
      originalCost: z.number(),
      freeShipping: z.boolean(),
      estimatedDays: z.string(),
      savedAmount: z.number().optional(),
    })
    .optional(),
  calculatedWeight: z.number().positive().optional(),
  // Old shipping rate (deprecated, keep for backward compatibility)
  shippingRate: z
    .object({
      courierName: z.string(),
      serviceName: z.string(),
      price: z.number(),
      insurance: z
        .any()
        .optional()
        .transform(val => {
          if (
            val === null ||
            val === undefined ||
            val === '' ||
            val === 'null' ||
            val === false
          ) {
            return null;
          }
          const num = Number(val);
          return isNaN(num) ? null : num;
        }),
      cod: z.boolean().optional(),
      codAmount: z
        .any()
        .optional()
        .transform(val => {
          if (
            val === null ||
            val === undefined ||
            val === '' ||
            val === 'null' ||
            val === false
          ) {
            return null;
          }
          const num = Number(val);
          return isNaN(num) ? null : num;
        }),
    })
    .optional(), // Selected shipping rate from admin-controlled shipping (deprecated)
});

/**
 * POST /api/orders - Create new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const orderData = createOrderSchema.parse(body);

    const isGuest = !session?.user || orderData.isGuest;
    let cartItems = orderData.cartItems;

    // If authenticated user but no cart items provided, get from database
    if (!isGuest && !cartItems) {
      const userCartItems = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: { product: true },
      });
      cartItems = userCartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }

    // If guest user, get cart from session/cookies
    if (isGuest && !cartItems) {
      const guestCart = getGuestCart();
      cartItems = guestCart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }

    // Validate cart items and calculate totals
    const products = await prisma.product.findMany({
      where: {
        id: { in: cartItems.map(item => item.productId) },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        sku: true,
        regularPrice: true,
        memberPrice: true,
        isPromotional: true,
        promotionalPrice: true,
        promotionStartDate: true,
        promotionEndDate: true,
        isQualifyingForMembership: true,
        stockQuantity: true,
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (products.length !== cartItems.length) {
      return NextResponse.json(
        { message: 'Some products are not available' },
        { status: 400 }
      );
    }

    // Check stock availability
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product || product.stockQuantity < cartItem.quantity) {
        return NextResponse.json(
          { message: `Insufficient stock for ${product?.name || 'product'}` },
          { status: 400 }
        );
      }
    }

    let user = null;
    let isMember = false;

    if (!isGuest && session?.user) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isMember: true, memberSince: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Only apply member pricing for users who are ALREADY members
      // Don't apply member pricing for pending memberships (activated during checkout)
      isMember = user.isMember;
    } else {
      // Guest user - don't apply member pricing during order creation
      // Membership will be activated after payment via webhook
      isMember = false;
    }

    // Calculate order totals using proper pricing logic
    let subtotal = 0;
    let memberSubtotal = 0;
    let qualifyingTotal = 0;
    let totalMemberDiscount = 0;
    let totalPromotionalDiscount = 0;
    const membershipConfig = await getMembershipConfig();

    const orderItems: Array<{
      productId: string;
      quantity: number;
      regularPrice: number;
      memberPrice: number;
      appliedPrice: number;
      totalPrice: number;
      productName: string;
      productSku: string;
    }> = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        continue;
      }

      const regularPrice = Number(product.regularPrice);
      const memberPrice = Number(product.memberPrice);

      // Use getBestPrice to get correct pricing including promotional discounts
      const bestPriceResult = getBestPrice(
        {
          regularPrice: regularPrice,
          memberPrice: memberPrice,
          isPromotional: product.isPromotional || false,
          promotionalPrice: product.promotionalPrice
            ? Number(product.promotionalPrice)
            : null,
          promotionStartDate: product.promotionStartDate,
          promotionEndDate: product.promotionEndDate,
          isQualifyingForMembership: product.isQualifyingForMembership,
        },
        isMember
      );

      const appliedPrice = bestPriceResult.price;
      const itemTotal = appliedPrice * cartItem.quantity;

      // Debug promotional pricing
      console.log(`🔍 Order Creation - Product: ${product.name}`);
      console.log(`   - regularPrice: ${regularPrice}`);
      console.log(`   - memberPrice: ${memberPrice}`);
      console.log(`   - isPromotional: ${product.isPromotional}`);
      console.log(`   - promotionalPrice: ${product.promotionalPrice}`);
      console.log(`   - promotionStartDate: ${product.promotionStartDate}`);
      console.log(`   - promotionEndDate: ${product.promotionEndDate}`);
      console.log(`   - isMember: ${isMember}`);
      console.log(`   - bestPriceResult:`, bestPriceResult);
      console.log(`   - appliedPrice: ${appliedPrice}`);

      subtotal += itemTotal;
      memberSubtotal += memberPrice * cartItem.quantity;

      // Calculate discounts based on price type
      if (bestPriceResult.priceType === 'promotional') {
        const basePrice = isMember ? memberPrice : regularPrice;
        const promotionalDiscount =
          (basePrice - appliedPrice) * cartItem.quantity;
        totalPromotionalDiscount += promotionalDiscount;
      } else if (bestPriceResult.priceType === 'member') {
        const memberDiscount =
          (regularPrice - appliedPrice) * cartItem.quantity;
        totalMemberDiscount += memberDiscount;
      }

      // Check if item qualifies for membership using product-level control
      if (!product.isPromotional && product.isQualifyingForMembership) {
        qualifyingTotal += regularPrice * cartItem.quantity;
      }

      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        regularPrice: regularPrice,
        memberPrice: memberPrice,
        appliedPrice: appliedPrice,
        totalPrice: itemTotal,
        productName: product.name,
        productSku: product.sku,
      });
    }

    // Use selected shipping from new implementation, fallback to old shippingRate
    let shippingCost = 0;
    let selectedCourierServiceId: string | null = null;
    let courierName: string | null = null;
    let courierServiceType: string | null = null;
    let courierServiceDetail: string | null = null;
    let estimatedDelivery: string | null = null;
    let shippingWeight: number | null = null;

    if (orderData.selectedShipping) {
      // New simplified shipping implementation
      shippingCost = orderData.selectedShipping.cost;
      selectedCourierServiceId = orderData.selectedShipping.serviceId;
      courierName = orderData.selectedShipping.courierName;
      courierServiceType = orderData.selectedShipping.serviceType; // 'parcel' or 'document'
      courierServiceDetail = orderData.selectedShipping.serviceDetail; // 'pickup', 'dropoff', or 'dropoff or pickup'
      estimatedDelivery = orderData.selectedShipping.estimatedDays;
      shippingWeight = orderData.calculatedWeight || null;

      console.log(
        `🚚 Using new shipping implementation: ${courierName} (${courierServiceType} - ${courierServiceDetail}) - RM${shippingCost}`,
        orderData.selectedShipping.freeShipping ? '(FREE SHIPPING)' : ''
      );
    } else if (orderData.shippingRate && orderData.shippingRate.price) {
      // Old admin-controlled shipping (backward compatibility)
      shippingCost = orderData.shippingRate.price;
      courierName = orderData.shippingRate.courierName;
      courierServiceType = orderData.shippingRate.serviceName;

      console.log(
        `🚚 Using old shipping rate: ${orderData.shippingRate.courierName} - ${orderData.shippingRate.serviceName} - RM${shippingCost}`
      );
    } else {
      // Fallback: flat rate shipping
      const freeShippingThreshold = 150;
      shippingCost = subtotal >= freeShippingThreshold ? 0 : 15;
      console.log(
        `🚚 Using temporary fallback shipping calculation: RM${shippingCost}`
      );
    }

    // No tax calculation for now - tax system not configured
    const taxAmount = 0;

    // Always use regular pricing for order creation (before membership activation)
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create order in database transaction
    const result = await prisma.$transaction(async tx => {
      // Helper function to find or create address (best practice: address deduplication)
      const findOrCreateAddress = async (
        addressData: any,
        type: 'SHIPPING' | 'BILLING'
      ) => {
        // For authenticated users, try to find existing identical address
        if (!isGuest && session?.user?.id) {
          const existingAddress = await tx.address.findFirst({
            where: {
              userId: session.user.id,
              firstName: addressData.firstName,
              lastName: addressData.lastName,
              addressLine1: addressData.address,
              addressLine2: addressData.address2 || null,
              city: addressData.city,
              state: addressData.state,
              postalCode: addressData.postcode,
              country: addressData.country,
              // Don't include phone and type in comparison as they might change
            },
          });

          if (existingAddress) {
            console.log(
              `♻️ Reusing existing ${type.toLowerCase()} address for user:`,
              session.user.id
            );

            // Update phone if it's different (phone can change while address stays same)
            if (existingAddress.phone !== addressData.phone) {
              await tx.address.update({
                where: { id: existingAddress.id },
                data: { phone: addressData.phone },
              });
              console.log(`📞 Updated phone number for existing address`);
            }

            return existingAddress;
          }
        }

        // Create new address if no match found or guest user
        console.log(`🆕 Creating new ${type.toLowerCase()} address`);
        return await tx.address.create({
          data: {
            userId: isGuest ? null : session?.user?.id || null,
            type: type, // This will be SHIPPING or BILLING for order-specific addresses
            firstName: addressData.firstName,
            lastName: addressData.lastName,
            addressLine1: addressData.address,
            addressLine2: addressData.address2 || null,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postcode,
            country: addressData.country,
            phone: addressData.phone || null,
          },
        });
      };

      // Find or create addresses using best practice deduplication
      const shippingAddr = await findOrCreateAddress(
        orderData.shippingAddress,
        'SHIPPING'
      );
      const billingAddr = await findOrCreateAddress(
        orderData.billingAddress,
        'BILLING'
      );

      // Set default address if user doesn't have one (best practice: auto-set default)
      if (!isGuest && session?.user?.id) {
        const hasDefaultAddress = await tx.address.findFirst({
          where: {
            userId: session.user.id,
            isDefault: true,
          },
        });

        if (!hasDefaultAddress && shippingAddr.userId) {
          // Set shipping address as default since it's usually the primary address
          // Only set default for user addresses (not guest addresses)
          await tx.address.update({
            where: { id: shippingAddr.id },
            data: { isDefault: true },
          });
          console.log(
            `✅ Set shipping address as default for user:`,
            session.user.id
          );
        }
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          user: isGuest ? undefined : { connect: { id: session?.user.id } },
          guestEmail: isGuest
            ? orderData.guestEmail || orderData.shippingAddress.email
            : null,
          orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: subtotal, // Using calculated subtotal with applied pricing
          taxAmount,
          shippingCost,
          total: totalAmount,
          paymentMethod: orderData.paymentMethod,
          customerNotes: orderData.orderNotes || null,
          memberDiscount: totalMemberDiscount,
          discountAmount: totalPromotionalDiscount,
          wasEligibleForMembership: Boolean(
            orderData.membershipActivated &&
              qualifyingTotal >= membershipConfig.membershipThreshold
          ),
          // ✅ CRITICAL: Include new shipping fields
          selectedCourierServiceId: selectedCourierServiceId,
          courierName: courierName,
          courierServiceType: courierServiceType, // 'parcel' or 'document'
          courierServiceDetail: courierServiceDetail, // 'pickup', 'dropoff', or 'dropoff or pickup'
          estimatedDelivery: estimatedDelivery,
          shippingWeight: shippingWeight,
          shippingAddress: { connect: { id: shippingAddr.id } },
          billingAddress: { connect: { id: billingAddr.id } },
          orderItems: {
            create: orderItems,
          },
        },
      });

      // Update product stock
      for (const cartItem of cartItems) {
        await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            stockQuantity: {
              decrement: cartItem.quantity,
            },
          },
        });
      }

      // Clear cart (user cart or guest cart)
      if (!isGuest) {
        await tx.cartItem.deleteMany({
          where: { userId: session!.user.id },
        });
      }

      // Create pending membership record (will be activated after successful payment)
      // Only for authenticated users or guests who want to become members
      if (
        orderData.membershipActivated &&
        qualifyingTotal >= membershipConfig.membershipThreshold &&
        (!user || !user?.isMember)
      ) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expire if not paid within 24 hours

        if (!isGuest) {
          // Authenticated user - create pending membership
          await tx.pendingMembership.create({
            data: {
              userId: session!.user.id,
              orderId: order.id,
              qualifyingAmount: qualifyingTotal,
              registrationData: {
                registerAsMember: orderData.membershipActivated,
                qualifyingAmount: qualifyingTotal,
                timestamp: new Date().toISOString(),
              },
              expiresAt,
            },
          });
        } else {
          // Guest user - store membership intent in order for post-payment processing
          await tx.order.update({
            where: { id: order.id },
            data: {
              guestMembershipIntent: {
                registerAsMember: true,
                qualifyingAmount: qualifyingTotal,
                membershipThreshold: membershipConfig.membershipThreshold,
                email: orderData.guestEmail || orderData.shippingAddress.email,
                firstName: orderData.shippingAddress.firstName,
                lastName: orderData.shippingAddress.lastName,
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
      }

      // Save as default address for authenticated users if they don't have one
      if (!isGuest) {
        const existingDefaultAddress = await tx.address.findFirst({
          where: {
            userId: session!.user.id,
            isDefault: true,
          },
        });

        // If user has no default address, mark this shipping address as default
        if (!existingDefaultAddress) {
          await tx.address.update({
            where: { id: shippingAddr.id },
            data: {
              isDefault: true,
              type: 'HOME', // Change from SHIPPING to HOME for future use
            },
          });
        }
      }

      // Create audit log (only for authenticated users)
      if (!isGuest) {
        await tx.auditLog.create({
          data: {
            userId: session!.user.id,
            action: 'CREATE',
            resource: 'Order',
            resourceId: order.id,
            details: {
              orderId: order.id,
              totalAmount,
              itemCount: cartItems.length,
              paymentMethod: orderData.paymentMethod,
              membershipActivated: orderData.membershipActivated,
              qualifyingAmount: qualifyingTotal,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
      }

      return order;
    });

    // Clear guest cart if this was a guest order
    if (isGuest) {
      clearGuestCart();
    }

    // Note: Telegram notifications are sent after successful payment in webhook handlers
    console.log(
      'Order created, awaiting payment confirmation:',
      result.orderNumber
    );

    // Create payment URL based on payment method
    let paymentUrl = null;
    const paymentMethod = orderData.paymentMethod.toLowerCase();

    if (paymentMethod === 'toyyibpay') {
      // Create toyyibPay bill
      paymentUrl = `/api/payment/create-bill?orderId=${result.id}`;
    }

    return NextResponse.json({
      message: 'Order created successfully',
      orderId: result.id,
      orderNumber: result.orderNumber,
      totalAmount,
      paymentUrl,
      membershipPending:
        orderData.membershipActivated &&
        qualifyingTotal >= membershipConfig.membershipThreshold,
    });
  } catch (error) {
    // Enhanced error logging for production debugging
    console.error('❌ Error creating order:', error);
    console.error(
      'Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    if (error instanceof z.ZodError) {
      // Create user-friendly error messages
      const fieldErrors: Record<string, string> = {};
      const friendlyFieldNames: Record<string, string> = {
        'shippingAddress.firstName': 'Shipping First Name',
        'shippingAddress.lastName': 'Shipping Last Name',
        'shippingAddress.email': 'Shipping Email',
        'shippingAddress.phone': 'Shipping Phone',
        'shippingAddress.address': 'Shipping Address',
        'shippingAddress.city': 'Shipping City',
        'shippingAddress.state': 'Shipping State',
        'shippingAddress.postcode': 'Shipping Postcode',
        'billingAddress.firstName': 'Billing First Name',
        'billingAddress.lastName': 'Billing Last Name',
        'billingAddress.email': 'Billing Email',
        'billingAddress.phone': 'Billing Phone',
        'billingAddress.address': 'Billing Address',
        'billingAddress.city': 'Billing City',
        'billingAddress.state': 'Billing State',
        'billingAddress.postcode': 'Billing Postcode',
      };

      error.issues.forEach(issue => {
        const fieldPath = issue.path.join('.');
        const friendlyName = friendlyFieldNames[fieldPath] || fieldPath;

        if (issue.code === 'too_small' && issue.type === 'string') {
          fieldErrors[fieldPath] = `${friendlyName} is required`;
        } else if (issue.code === 'invalid_type') {
          fieldErrors[fieldPath] = `${friendlyName} is required`;
        } else if (
          issue.code === 'invalid_string' &&
          issue.validation === 'email'
        ) {
          fieldErrors[fieldPath] = `Please enter a valid email address`;
        } else {
          fieldErrors[fieldPath] = `${friendlyName}: ${issue.message}`;
        }
      });

      // Create summary message
      const missingFields = Object.values(fieldErrors);
      const summaryMessage =
        missingFields.length === 1
          ? missingFields[0]
          : `Please fill in the following required fields: ${missingFields.join(', ')}`;

      return NextResponse.json(
        {
          message: summaryMessage,
          fieldErrors,
          errors: error.issues, // Keep original for debugging
        },
        { status: 400 }
      );
    }

    // Return more detailed error message in development
    const errorMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? `Failed to create order: ${error.message}`
        : 'Failed to create order';

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/orders - Get user's orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
