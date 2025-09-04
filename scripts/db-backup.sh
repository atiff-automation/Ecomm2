#!/bin/bash

# Database Backup Script - Production Safe
# Never run destructive operations without backup

set -e

# Configuration
DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Database Backup System${NC}"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo -e "${YELLOW}📦 Creating backup...${NC}"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully: $BACKUP_FILE${NC}"
    
    # Show backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Keep only last 10 backups
    echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 10)...${NC}"
    ls -t "${BACKUP_DIR}"/backup_*.sql | tail -n +11 | xargs -r rm
    
    echo -e "${GREEN}✅ Backup process completed${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi