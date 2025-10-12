#!/bin/bash

###############################################################################
# Mock Fulfillment Testing Script
#
# PURPOSE: Test payment validation logic on production without EasyParcel cost
# NO COST: Uses mock responses, does NOT call EasyParcel API
#
# Usage:
#   ./scripts/test-mock-fulfillment.sh <order-id> [mode]
#
# Examples:
#   ./scripts/test-mock-fulfillment.sh cm2vxxxxx success
#   ./scripts/test-mock-fulfillment.sh cm2vxxxxx insufficient_balance
#
# Modes:
#   success              - Test with "Payment Done" response (real captured)
#   insufficient_balance - Test with insufficient balance error
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ORDER_ID="${1:-}"
MODE="${2:-success}"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Display usage
if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}Error: Order ID is required${NC}"
  echo ""
  echo "Usage: $0 <order-id> [mode]"
  echo ""
  echo "Examples:"
  echo "  $0 cm2vxxxxx success"
  echo "  $0 cm2vxxxxx insufficient_balance"
  echo ""
  echo "Modes:"
  echo "  success              - Test with 'Payment Done' response (real captured)"
  echo "  insufficient_balance - Test with insufficient balance error"
  echo ""
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Mock Fulfillment Test (NO EASYPARCEL API CALLS)       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Order ID:${NC} $ORDER_ID"
echo -e "${YELLOW}Mode:${NC} $MODE"
echo -e "${YELLOW}Base URL:${NC} $BASE_URL"
echo ""

# Check if logged in (for production)
if [[ "$BASE_URL" == *"railway.app"* ]]; then
  echo -e "${YELLOW}⚠️  Testing against production Railway${NC}"
  echo ""
fi

# Make API request
echo -e "${BLUE}Sending mock test request...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "$BASE_URL/api/admin/orders/$ORDER_ID/fulfill-test" \
  -H "Content-Type: application/json" \
  -d "{\"mode\": \"$MODE\"}")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}HTTP Status:${NC} $HTTP_CODE"
echo ""

# Pretty print JSON response
if command -v jq &> /dev/null; then
  echo "$BODY" | jq '.'
else
  echo "$BODY"
fi

echo ""

# Display result
if [ "$HTTP_CODE" -eq 200 ]; then
  SUCCESS=$(echo "$BODY" | grep -o '"success":true' || echo "")

  if [ -n "$SUCCESS" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    ✅ TEST PASSED                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}The validation logic ACCEPTED the mock response!${NC}"
    echo -e "${GREEN}This means the fix is working correctly.${NC}"
  else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ❌ TEST FAILED                          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${RED}The validation logic REJECTED the mock response.${NC}"
  fi
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                    ❌ REQUEST FAILED                       ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  echo -e "${RED}HTTP $HTTP_CODE - Check error message above${NC}"
fi

echo ""
echo -e "${BLUE}Note: This was a TEST - no real EasyParcel API calls made${NC}"
echo -e "${BLUE}      Order was NOT actually updated in the database${NC}"
echo ""
