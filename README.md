# JRM E-commerce with Membership System

## Project Overview

A comprehensive e-commerce platform built with Next.js 14, featuring an intelligent membership qualification system designed specifically for the Malaysian market.

### Key Features

- **Intelligent Membership System**: Automatic qualification based on purchase thresholds and product categories
- **Comprehensive Customer Experience**: Product reviews, wishlists, abandoned cart recovery, promotional system
- **Advanced Admin Dashboard**: Complete business management with analytics, inventory, and customer service tools
- **Enterprise Bulk Operations**: Comprehensive import/export system for products, orders, customers, and inventory
- **Malaysian Compliance Suite**: GST/SST reporting, PDPA data export, audit trails, tax compliance automation
- **SuperAdmin Access**: Emergency admin account management and system maintenance (simplified)
- **Malaysian Market Optimized**: Billplz payments, EasyParcel shipping, local business integration
- **Mobile-First Design**: Responsive web interface optimized for Malaysian mobile users
- **Customer Retention Features**: Email marketing, loyalty programs, personalized recommendations
- **Performance Optimized**: Built with SuperClaude v2.0.1 methodology for maximum efficiency

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui with mobile-first responsive design
- **Backend**: Next.js API Routes, Prisma ORM, Bull.js for background jobs
- **Database**: PostgreSQL with advanced indexing and 20+ optimized tables
- **Authentication**: NextAuth.js with granular role-based access control
- **File Management**: Local storage with Sharp.js image optimization
- **Email**: SendGrid/Mailgun integration with automated campaigns
- **Payment**: Billplz integration with Malaysian compliance
- **Shipping**: EasyParcel API with local zones
- **Caching**: Redis for sessions, cart data, and performance optimization
- **Security**: OWASP Top 10 compliance, PDPA data protection
- **Monitoring**: Sentry, comprehensive audit trails, business analytics

## Architecture

- **Role Hierarchy**: Customer < Staff < Admin < SuperAdmin (emergency access only)
- **Database Design**: 25+ tables with comprehensive business logic, bulk operations, and performance indexes
- **API Architecture**: 90+ RESTful endpoints covering all business operations including bulk import/export
- **Bulk Operations**: Enterprise-grade import/export system with background processing and error recovery
- **Security**: OWASP Top 10 compliant, PDPA data protection, PCI DSS guidelines, comprehensive audit trails
- **Performance**: Multi-layer caching, image optimization, background job processing, bulk operation optimization
- **Scalability**: Designed for growth from 100 to 10,000+ products with high-volume bulk operations
- **Separation of Concerns**: Admin manages all business operations, SuperAdmin provides emergency support only
- **Malaysian Compliance**: GST/SST automation, PDPA compliance, local address validation, cultural adaptations
- **Business Intelligence**: Advanced reporting, tax compliance, customer analytics, operational efficiency metrics

## Development Timeline

**Total Duration**: 20 weeks (5 months)
**Methodology**: SuperClaude v2.0.1 evidence-based development
**Status**: Planning phase complete, ready for development

## Documentation

- [`projectplanning.md`](./projectplanning.md) - Comprehensive project specification
- [`todo.md`](./todo.md) - Detailed task breakdown and progress tracking

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (for caching)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd JRMEcom

# Install dependencies (when available)
npm install

# Setup environment variables
cp .env.example .env.local

# Setup database with enhanced schema
npx prisma migrate dev
npx prisma generate

# Setup Redis for caching and background jobs
# Install Redis locally or use cloud service

# Create upload directories
mkdir -p public/uploads/{products,users,system,temp}

# Run development server
npm run dev
```

## Project Structure

```
JRMEcom/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── ecommerce/       # Product cards, cart, pricing
│   │   ├── customer/        # Reviews, wishlist, support
│   │   ├── admin/           # Admin dashboard components
│   │   ├── bulk-operations/ # Import/export UI components
│   │   └── marketing/       # Promotional banners, campaigns
│   ├── lib/
│   │   ├── auth/            # Authentication utilities
│   │   ├── email/           # Email templates and sending
│   │   ├── files/           # File upload and management
│   │   ├── bulk-operations/ # Import/export processing logic
│   │   ├── malaysian-compliance/ # GST/SST, PDPA utilities
│   │   ├── promotions/      # Discount calculation logic
│   │   ├── analytics/       # Business metrics calculation
│   │   └── security/        # Input validation, sanitization
│   └── pages/api/
│       ├── products/        # Product and catalog endpoints
│       ├── cart/            # Shopping cart management
│       ├── orders/          # Order processing
│       ├── reviews/         # Product review system
│       ├── promotions/      # Promotional campaigns
│       ├── support/         # Customer service
│       ├── bulk-operations/ # Import/export API endpoints
│       ├── compliance/      # Malaysian regulatory compliance
│       ├── admin/           # Business management endpoints
│       └── superadmin/      # Emergency access endpoints
├── public/uploads/
│   ├── products/            # Product images and documents
│   ├── users/               # User avatars and content
│   ├── system/              # System files and reports
│   └── temp/                # Temporary processing files
├── projectplanning.md       # Complete project specification
├── todo.md                  # Task breakdown and progress tracking
├── .gitignore              # Git ignore patterns
├── README.md               # Project overview (this file)
└── .claude/                # Claude workspace configuration
```

## Contributing

1. Follow the task breakdown in `todo.md`
2. Maintain SuperClaude v2.0.1 methodology standards
3. Commit frequently with descriptive messages
4. Update progress in `todo.md` for completed tasks
5. Ensure all code follows evidence-based development practices

## License

This project is proprietary software for JRM E-commerce.

## Support

For development questions, refer to the comprehensive documentation in `projectplanning.md` and track progress in `todo.md`.

---

**Built with SuperClaude v2.0.1 methodology**  
**Evidence-based development | Performance optimized | Security first | Simplified administration**
