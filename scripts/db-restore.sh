#!/bin/bash

# Database Restore Script
# Restores database from backup file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKUP_DIR="./backups"

echo -e "${YELLOW}🔄 Database Restore System${NC}"

# Check if backups exist
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
    echo -e "${RED}❌ No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

# List available backups
echo -e "${YELLOW}📋 Available backups:${NC}"
ls -la "$BACKUP_DIR"/*.sql | awk '{print NR ") " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}'

echo
read -p "Enter backup number to restore (or 'cancel'): " choice

if [[ "$choice" == "cancel" ]]; then
    echo -e "${GREEN}✅ Restore cancelled${NC}"
    exit 0
fi

# Get the selected backup file
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql | sed -n "${choice}p")

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Invalid backup selection${NC}"
    exit 1
fi

echo -e "${YELLOW}Selected backup: $BACKUP_FILE${NC}"

# Confirmation for restore
echo -e "${RED}⚠️  WARNING: This will REPLACE all current database data${NC}"
read -p "Type 'RESTORE_DATABASE' to confirm: " confirm

if [[ "$confirm" != "RESTORE_DATABASE" ]]; then
    echo -e "${GREEN}✅ Restore cancelled${NC}"
    exit 0
fi

# Create backup of current state before restore
echo -e "${YELLOW}📦 Creating backup of current state...${NC}"
./scripts/db-backup.sh

# Drop and recreate database
DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"

echo -e "${YELLOW}🗃️  Dropping and recreating database...${NC}"
dropdb "$DB_NAME" --if-exists
createdb "$DB_NAME"

# Restore from backup
echo -e "${YELLOW}🔄 Restoring from backup...${NC}"
psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully from: $BACKUP_FILE${NC}"
    
    # Update Prisma client
    echo -e "${YELLOW}🔄 Updating Prisma client...${NC}"
    npx prisma generate
    
    echo -e "${GREEN}✅ Restore process completed${NC}"
else
    echo -e "${RED}❌ Restore failed${NC}"
    exit 1
fi