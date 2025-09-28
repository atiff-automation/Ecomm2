# Railway Deployment Guide - JRM E-commerce Platform

This guide provides systematic deployment instructions for the JRM E-commerce Platform to Railway's hobby package.

## ✅ Pre-Deployment Checklist

### Required Files Created:
- [x] `railway.toml` - Railway configuration
- [x] `Dockerfile` - Container configuration
- [x] `scripts/railway-deploy.sh` - Database setup script
- [x] Updated `next.config.mjs` with standalone output
- [x] Fixed TypeScript configuration
- [x] Installed missing dependencies

### Configuration Summary:
- **Framework**: Next.js 14.2.31 with standalone output mode
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **File Storage**: Local uploads (Railway filesystem)
- **Cache**: Redis for sessions and background jobs
- **Build**: Optimized production build with Docker

---

## 🚀 Railway Deployment Steps

### Step 1: Create Railway Project
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### Step 2: Add Required Services

#### PostgreSQL Database
```bash
# Add PostgreSQL plugin
railway add postgresql
```

#### Redis Cache
```bash
# Add Redis plugin
railway add redis
```

### Step 3: Configure Environment Variables

Set these variables in Railway dashboard or CLI:

#### Core Application
```bash
railway variables set NODE_ENV=production
railway variables set NEXTAUTH_SECRET="your-nextauth-secret-here"
railway variables set NEXTAUTH_URL="${{RAILWAY_STATIC_URL}}"
```

#### Database (Auto-configured by Railway)
```bash
# DATABASE_URL - automatically set by Railway PostgreSQL
# REDIS_URL - automatically set by Railway Redis
```

#### Business Configuration
```bash
railway variables set BUSINESS_NAME="EcomJRM Store"
railway variables set BUSINESS_EMAIL="store@ecomjrm.com"
railway variables set BUSINESS_PHONE="+60123456789"
railway variables set DEFAULT_CURRENCY="MYR"
railway variables set MEMBERSHIP_THRESHOLD="80.00"
```

#### Telegram Notifications (Optional)
```bash
railway variables set TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
railway variables set TELEGRAM_ORDERS_CHAT_ID="your-orders-chat-id"
railway variables set TELEGRAM_INVENTORY_CHAT_ID="your-inventory-chat-id"
```

#### Security Keys
```bash
# Generate secure keys for production
railway variables set ENCRYPTION_KEY="$(openssl rand -base64 32)"
railway variables set TELEGRAM_CONFIG_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

#### Email Configuration (Configure based on your provider)
```bash
railway variables set EMAIL_FROM="noreply@yourdomain.com"
railway variables set EMAIL_SERVER_HOST="smtp.your-provider.com"
railway variables set EMAIL_SERVER_PORT="587"
railway variables set EMAIL_SERVER_USER="your-smtp-user"
railway variables set EMAIL_SERVER_PASSWORD="your-smtp-password"
```

### Step 4: Deploy Application
```bash
# Deploy to Railway
railway up
```

### Step 5: Post-Deployment Setup

#### Run Database Migrations
```bash
# Connect to Railway project
railway shell

# Run the deployment script
chmod +x scripts/railway-deploy.sh
./scripts/railway-deploy.sh
```

Or manually run:
```bash
npx prisma migrate deploy
npm run db:seed:production
```

---

## 🔧 Configuration Details

### Railway Service Configuration

#### Build Settings
- **Builder**: Nixpacks (automatic detection)
- **Start Command**: `npm start`
- **Health Check**: `GET /` (200 OK)
- **Memory**: 512MB (Railway hobby limit)
- **Timeout**: 300 seconds

#### Port Configuration
- **Application Port**: 3000 (default Next.js)
- **Health Check**: Railway automatically detects

### Database Schema
The application includes:
- User management with Malaysian membership system
- Product catalog with categories
- Order processing with Malaysian shipping integration
- Admin dashboard with analytics
- Telegram notifications
- Chat system
- Malaysian postcode data (40,000+ entries)

### File Storage
- **Upload Directory**: `/uploads` (Railway filesystem)
- **Allowed Types**: Images (JPEG, PNG, WebP), PDFs
- **Max Size**: 10MB per file
- **Persistence**: Files persist across deployments

---

## 📊 Expected Resource Usage

### Railway Hobby Package Limits:
- **Memory**: 512MB (should be sufficient)
- **CPU**: Shared vCPU (adequate for low-medium traffic)
- **Network**: 100GB/month outbound
- **Build Time**: ~3-5 minutes
- **Cold Start**: ~10-15 seconds

### Performance Optimizations Applied:
- Standalone Next.js output (smaller container)
- Production build optimizations
- Prisma connection pooling
- Redis caching for sessions
- Image optimization enabled
- Webpack bundle splitting

---

## 🛠 Troubleshooting

### Common Issues:

#### Build Timeouts
```bash
# If build times out, try building locally first
npm run build
# Then deploy pre-built
```

#### Database Connection Issues
```bash
# Check database URL
railway variables
# Verify Prisma connection
railway shell
npx prisma db pull
```

#### Memory Issues
```bash
# Monitor memory usage
railway logs
# Optimize if needed by reducing concurrent operations
```

#### Environment Variables Not Loading
```bash
# List all variables
railway variables
# Check for typos or missing values
```

### Debugging Commands:
```bash
# View application logs
railway logs

# Connect to database
railway connect postgresql

# Run database queries
railway shell
npx prisma studio --port 5555
```

---

## 🔄 Updates and Maintenance

### Deploying Updates:
```bash
# Pull latest changes
git pull origin main

# Deploy to Railway
railway up
```

### Database Migrations:
```bash
# For schema changes
railway shell
npx prisma migrate deploy
```

### Monitoring:
- **Railway Dashboard**: Monitor resource usage, logs, deployments
- **Application Logs**: View in Railway logs or application admin panel
- **Database**: Use Prisma Studio for database management

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database seeded with Malaysian data
- [ ] SSL certificate active (automatic on Railway)
- [ ] Domain configured (if using custom domain)
- [ ] Telegram notifications tested
- [ ] Email configuration verified
- [ ] Admin accounts created
- [ ] Payment integration tested (if applicable)
- [ ] Backup strategy implemented

---

## 📝 Notes

1. **Railway Hobby Package** is perfect for MVP and low-traffic applications
2. **Upgrade to Pro** when you need more resources or custom domains
3. **Malaysian Features** include postcode validation, shipping zones, and local business configuration
4. **Monitoring** is built-in with Railway's dashboard and application-level analytics
5. **Scaling** can be achieved by upgrading Railway plan or optimizing application code

## 🆘 Support

If you encounter issues:
1. Check Railway status page
2. Review application logs in Railway dashboard
3. Verify environment variables
4. Test database connectivity
5. Check for recent deployments or changes

Railway Documentation: https://docs.railway.app/
JRM E-commerce Issues: Check application admin panel or logs