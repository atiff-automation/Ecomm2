# EcomJRM

Malaysian E-commerce Platform with simplified Telegram notification system.

## Features
- Admin-only Telegram configuration via web UI
- Order and inventory notifications
- Database-driven configuration (no .env dependency)
- Secure payment integration with ToyyibPay
- Product management with image uploads
- Member management system

## Setup
1. Copy `.env.example` to `.env` and configure your environment variables
2. Run `npm install`
3. Set up your PostgreSQL database
4. Run `npx prisma migrate deploy`
5. Run `npm run dev`

Built with Next.js, Prisma, and TypeScript.

