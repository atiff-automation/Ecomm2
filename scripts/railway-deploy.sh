#!/bin/bash
# Railway Deployment Script for JRM E-commerce
# Handles database migration and postcode seeding for production

set -e  # Exit on any error

echo "🚂 Starting Railway deployment process..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ] || [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    echo "🏭 Production environment detected"

    # Run database migrations
    echo "📊 Running database migrations..."
    npx prisma migrate deploy

    # Seed Malaysian postcode data (idempotent)
    echo "🌱 Seeding Malaysian postcode data..."
    npx tsx prisma/seed-malaysian-postcodes.ts

    echo "✅ Railway deployment completed successfully!"
else
    echo "🔧 Development environment - skipping production setup"
fi