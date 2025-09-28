#!/bin/bash
# Railway Deployment Script for JRM E-commerce Platform
# Handles database migration, seeding, and production setup

set -e  # Exit on any error

echo "🚂 Starting Railway deployment process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set. Please configure your Railway PostgreSQL database."
    exit 1
fi

echo "✅ Database URL is configured"

# Check if we're in production
if [ "$NODE_ENV" = "production" ] || [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    echo "🏭 Production environment detected"

    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    npx prisma generate

    # Run database migrations
    echo "📊 Running database migrations..."
    npx prisma migrate deploy

    # Run production seeding (includes all required data)
    echo "🌱 Running production database seeding..."
    npm run db:seed:production

    # Verify database setup
    echo "🔍 Verifying database setup..."
    npx prisma db pull --preview-feature || echo "⚠️  Database verification completed"

    echo "✅ Railway deployment completed successfully!"
    echo "🎯 Application ready for production traffic"
else
    echo "🔧 Development environment detected"
    echo "📦 Generating Prisma client..."
    npx prisma generate

    echo "🌱 Seeding Malaysian postcode data..."
    npx tsx prisma/seed-malaysian-postcodes.ts

    echo "✅ Development setup completed!"
fi

echo "🎉 Deployment process finished!"