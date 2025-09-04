#!/bin/bash

# Production-Safe Migration Script
# NEVER allows destructive operations without explicit backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 PRODUCTION-SAFE MIGRATION SYSTEM 🚨${NC}"
echo -e "${YELLOW}This script PREVENTS data loss by enforcing backup-first policy${NC}"
echo

# Check if this is production environment
if [[ "$NODE_ENV" == "production" ]] || [[ "$DATABASE_URL" == *"prod"* ]]; then
    echo -e "${RED}⚠️  PRODUCTION ENVIRONMENT DETECTED${NC}"
    ENVIRONMENT="PRODUCTION"
else
    echo -e "${YELLOW}📝 Development environment detected${NC}"
    ENVIRONMENT="DEVELOPMENT"
fi

# Function to create backup
create_backup() {
    echo -e "${YELLOW}📦 Creating pre-migration backup...${NC}"
    ./scripts/db-backup.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backup failed - ABORTING migration${NC}"
        exit 1
    fi
}

# Function to show migration status
show_migration_status() {
    echo -e "${YELLOW}📊 Current migration status:${NC}"
    npx prisma migrate status
    echo
}

# Main migration logic
echo -e "${YELLOW}🔍 Checking migration requirements...${NC}"
show_migration_status

echo
echo -e "${YELLOW}Choose migration option:${NC}"
echo "1) Safe migrate (recommended) - Creates backup first"
echo "2) Generate new migration only"  
echo "3) Deploy existing migrations"
echo "4) Reset database (DEVELOPMENT ONLY - DESTROYS DATA)"
echo "5) Cancel"

read -p "Enter your choice [1-5]: " choice

case $choice in
    1)
        echo -e "${GREEN}✅ Safe migration selected${NC}"
        create_backup
        echo -e "${YELLOW}🔄 Running migration...${NC}"
        npx prisma migrate dev
        echo -e "${GREEN}✅ Migration completed safely${NC}"
        ;;
    2)
        echo -e "${YELLOW}📝 Generating new migration...${NC}"
        read -p "Enter migration name: " migration_name
        npx prisma migrate dev --name "$migration_name" --create-only
        echo -e "${GREEN}✅ Migration file created - review before applying${NC}"
        ;;
    3)
        if [[ "$ENVIRONMENT" == "PRODUCTION" ]]; then
            create_backup
        fi
        echo -e "${YELLOW}🔄 Deploying migrations...${NC}"
        npx prisma migrate deploy
        echo -e "${GREEN}✅ Migrations deployed${NC}"
        ;;
    4)
        if [[ "$ENVIRONMENT" == "PRODUCTION" ]]; then
            echo -e "${RED}❌ DATABASE RESET IS FORBIDDEN IN PRODUCTION${NC}"
            echo -e "${RED}This would destroy all production data!${NC}"
            exit 1
        fi
        
        echo -e "${RED}⚠️  WARNING: This will DESTROY ALL DATA${NC}"
        echo -e "${RED}Only use this in development environment${NC}"
        read -p "Type 'DESTROY_DATA' to confirm: " confirm
        
        if [[ "$confirm" == "DESTROY_DATA" ]]; then
            echo -e "${YELLOW}📦 Creating backup before reset...${NC}"
            create_backup
            echo -e "${RED}💥 Resetting database...${NC}"
            npx prisma db push --force-reset
            echo -e "${YELLOW}⚠️  All data has been destroyed and schema reset${NC}"
        else
            echo -e "${GREEN}✅ Reset cancelled${NC}"
        fi
        ;;
    5)
        echo -e "${GREEN}✅ Migration cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac