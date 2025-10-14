#!/bin/bash
# ============================================================================
# EasyParcel Courier Consistency Test
# ============================================================================
# Purpose: Test if courier_name remains consistent across Rate → Create → Pay
#
# Flow:
# 1. EPRateCheckingBulk - Get available rates and service_ids
# 2. EPSubmitOrderBulk - Create shipment with selected service_id
# 3. EPPayOrderBulk - Pay for order and get final AWB
#
# Expected: courier_name should be CONSISTENT across all three calls
# ============================================================================

set -e  # Exit on error

# Configuration
API_KEY="EP-10Fqii5ZP"
BASE_URL="http://demo.connect.easyparcel.my"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="/tmp/easyparcel_test_${TIMESTAMP}"

# Create log directory
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}EasyParcel Courier Consistency Test${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Timestamp: $TIMESTAMP"
echo -e "Log Directory: $LOG_DIR"
echo ""

# ============================================================================
# STEP 1: Get Shipping Rates (EPRateCheckingBulk)
# ============================================================================
echo -e "${YELLOW}[STEP 1] Getting Shipping Rates...${NC}"

RATE_RESPONSE=$(curl -s -X POST \
  --max-time 300 \
  "${BASE_URL}/?ac=EPRateCheckingBulk" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "api=${API_KEY}" \
  --data-urlencode "bulk[0][pick_code]=20000" \
  --data-urlencode "bulk[0][pick_state]=TRG" \
  --data-urlencode "bulk[0][pick_country]=MY" \
  --data-urlencode "bulk[0][send_code]=50000" \
  --data-urlencode "bulk[0][send_state]=KUL" \
  --data-urlencode "bulk[0][send_country]=MY" \
  --data-urlencode "bulk[0][weight]=1")

# Save response
echo "$RATE_RESPONSE" > "$LOG_DIR/01_rate_response.json"
echo "$RATE_RESPONSE" | jq '.' > "$LOG_DIR/01_rate_response_pretty.json" 2>/dev/null || true

# Extract key information
echo -e "\n${GREEN}Available Couriers:${NC}"
echo "$RATE_RESPONSE" | jq -r '.result[0].rates[] | "\(.service_id) | \(.courier_name) | \(.service_detail) | RM \(.price)"' 2>/dev/null | head -10 || echo "Failed to parse rates"

# Prompt user to select a service_id
echo -e "\n${YELLOW}Enter the service_id you want to test:${NC}"
read -p "service_id: " SERVICE_ID

if [ -z "$SERVICE_ID" ]; then
  echo -e "${RED}Error: No service_id provided${NC}"
  exit 1
fi

# Extract courier info for selected service_id
RATE_COURIER=$(echo "$RATE_RESPONSE" | jq -r ".result[0].rates[] | select(.service_id==\"$SERVICE_ID\") | .courier_name" 2>/dev/null)
RATE_SERVICE=$(echo "$RATE_RESPONSE" | jq -r ".result[0].rates[] | select(.service_id==\"$SERVICE_ID\") | .service_name" 2>/dev/null)
RATE_PRICE=$(echo "$RATE_RESPONSE" | jq -r ".result[0].rates[] | select(.service_id==\"$SERVICE_ID\") | .price" 2>/dev/null)

echo -e "\n${GREEN}Selected Service:${NC}"
echo "  Service ID: $SERVICE_ID"
echo "  Courier: $RATE_COURIER"
echo "  Service: $RATE_SERVICE"
echo "  Price: RM $RATE_PRICE"

# ============================================================================
# STEP 2: Create Shipment (EPSubmitOrderBulk)
# ============================================================================
echo -e "\n${YELLOW}[STEP 2] Creating Shipment with service_id: $SERVICE_ID...${NC}"

PICKUP_DATE=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
REFERENCE="TEST-CURL-${TIMESTAMP}"

CREATE_RESPONSE=$(curl -s -X POST \
  --max-time 300 \
  "${BASE_URL}/?ac=EPSubmitOrderBulk" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "api=${API_KEY}" \
  --data-urlencode "bulk[0][service_id]=${SERVICE_ID}" \
  --data-urlencode "bulk[0][weight]=1" \
  --data-urlencode "bulk[0][content]=Test Package" \
  --data-urlencode "bulk[0][value]=100" \
  --data-urlencode "bulk[0][pick_name]=EcomJRM Store" \
  --data-urlencode "bulk[0][pick_contact]=60123456789" \
  --data-urlencode "bulk[0][pick_addr1]=No. 123, Jalan Technology" \
  --data-urlencode "bulk[0][pick_addr2]=Level 5, Tech Plaza" \
  --data-urlencode "bulk[0][pick_city]=Kuala Terengganu" \
  --data-urlencode "bulk[0][pick_state]=TRG" \
  --data-urlencode "bulk[0][pick_code]=20000" \
  --data-urlencode "bulk[0][pick_country]=MY" \
  --data-urlencode "bulk[0][send_name]=Test Customer" \
  --data-urlencode "bulk[0][send_contact]=60187654321" \
  --data-urlencode "bulk[0][send_addr1]=No. 456, Jalan Test" \
  --data-urlencode "bulk[0][send_addr2]=Apartment 10" \
  --data-urlencode "bulk[0][send_city]=Kuala Lumpur" \
  --data-urlencode "bulk[0][send_state]=KUL" \
  --data-urlencode "bulk[0][send_code]=50000" \
  --data-urlencode "bulk[0][send_country]=MY" \
  --data-urlencode "bulk[0][collect_date]=${PICKUP_DATE}" \
  --data-urlencode "bulk[0][reference]=${REFERENCE}")

# Save response
echo "$CREATE_RESPONSE" > "$LOG_DIR/02_create_response.json"
echo "$CREATE_RESPONSE" | jq '.' > "$LOG_DIR/02_create_response_pretty.json" 2>/dev/null || true

# Extract order information
ORDER_NUMBER=$(echo "$CREATE_RESPONSE" | jq -r '.result[0].order_number // empty' 2>/dev/null)
CREATE_COURIER=$(echo "$CREATE_RESPONSE" | jq -r '.result[0].courier // empty' 2>/dev/null)
CREATE_PRICE=$(echo "$CREATE_RESPONSE" | jq -r '.result[0].price // empty' 2>/dev/null)
CREATE_STATUS=$(echo "$CREATE_RESPONSE" | jq -r '.result[0].status // empty' 2>/dev/null)
CREATE_REMARKS=$(echo "$CREATE_RESPONSE" | jq -r '.result[0].remarks // empty' 2>/dev/null)

echo -e "\n${GREEN}Shipment Created:${NC}"
echo "  Status: $CREATE_STATUS"
echo "  Order Number: $ORDER_NUMBER"
echo "  Courier: $CREATE_COURIER"
echo "  Price: RM $CREATE_PRICE"
echo "  Remarks: $CREATE_REMARKS"

if [ -z "$ORDER_NUMBER" ] || [ "$CREATE_STATUS" != "Success" ]; then
  echo -e "${RED}Error: Failed to create shipment${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

# ============================================================================
# STEP 3: Pay for Order (EPPayOrderBulk)
# ============================================================================
echo -e "\n${YELLOW}[STEP 3] Paying for Order: $ORDER_NUMBER...${NC}"

PAY_RESPONSE=$(curl -s -X POST \
  --max-time 300 \
  "${BASE_URL}/?ac=EPPayOrderBulk" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "api=${API_KEY}" \
  --data-urlencode "bulk[0][order_no]=${ORDER_NUMBER}")

# Save response
echo "$PAY_RESPONSE" > "$LOG_DIR/03_pay_response.json"
echo "$PAY_RESPONSE" | jq '.' > "$LOG_DIR/03_pay_response_pretty.json" 2>/dev/null || true

# Extract payment information
PAY_STATUS=$(echo "$PAY_RESPONSE" | jq -r '.result[0].messagenow // empty' 2>/dev/null)
PAY_ORDER_NO=$(echo "$PAY_RESPONSE" | jq -r '.result[0].orderno // empty' 2>/dev/null)
PARCEL_NO=$(echo "$PAY_RESPONSE" | jq -r '.result[0].parcel[0].parcelno // .result[0].parcel.parcelno // empty' 2>/dev/null)
AWB=$(echo "$PAY_RESPONSE" | jq -r '.result[0].parcel[0].awb // .result[0].parcel.awb // empty' 2>/dev/null)

echo -e "\n${GREEN}Payment Complete:${NC}"
echo "  Payment Status: $PAY_STATUS"
echo "  Order Number: $PAY_ORDER_NO"
echo "  Parcel Number: $PARCEL_NO"
echo "  AWB: $AWB"

# ============================================================================
# STEP 4: Compare Courier Names
# ============================================================================
echo -e "\n${BLUE}============================================================================${NC}"
echo -e "${BLUE}COURIER CONSISTENCY ANALYSIS${NC}"
echo -e "${BLUE}============================================================================${NC}"

echo -e "\n${YELLOW}Courier Name Comparison:${NC}"
echo "  [STEP 1] Rate Check Courier:     ${GREEN}${RATE_COURIER}${NC}"
echo "  [STEP 2] Create Shipment Courier: ${YELLOW}${CREATE_COURIER}${NC}"
echo "  [STEP 3] Pay Order (Final):       ${BLUE}(Not returned in EPPayOrderBulk)${NC}"

echo -e "\n${YELLOW}Service ID Tracking:${NC}"
echo "  Selected service_id: ${GREEN}${SERVICE_ID}${NC}"

# Check for mismatch
if [ "$RATE_COURIER" != "$CREATE_COURIER" ]; then
  echo -e "\n${RED}⚠️  COURIER MISMATCH DETECTED!${NC}"
  echo -e "${RED}   Rate Check returned: ${RATE_COURIER}${NC}"
  echo -e "${RED}   Shipment created with: ${CREATE_COURIER}${NC}"
  echo -e "\n${RED}This is the same issue you're experiencing!${NC}"
  MISMATCH=true
else
  echo -e "\n${GREEN}✓ Courier names are CONSISTENT${NC}"
  MISMATCH=false
fi

# ============================================================================
# Summary Report
# ============================================================================
echo -e "\n${BLUE}============================================================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}============================================================================${NC}"

cat > "$LOG_DIR/SUMMARY.txt" << EOF
EasyParcel Courier Consistency Test
Timestamp: $TIMESTAMP
Reference: $REFERENCE

SERVICE SELECTION:
  Service ID: $SERVICE_ID
  Expected Courier: $RATE_COURIER
  Expected Price: RM $RATE_PRICE

STEP 1 - RATE CHECK (EPRateCheckingBulk):
  Courier Name: $RATE_COURIER
  Service Name: $RATE_SERVICE
  Price: RM $RATE_PRICE

STEP 2 - CREATE SHIPMENT (EPSubmitOrderBulk):
  Order Number: $ORDER_NUMBER
  Courier Name: $CREATE_COURIER
  Price: RM $CREATE_PRICE
  Status: $CREATE_STATUS

STEP 3 - PAY ORDER (EPPayOrderBulk):
  Payment Status: $PAY_STATUS
  Parcel Number: $PARCEL_NO
  AWB: $AWB

ANALYSIS:
  Courier Mismatch: $([ "$MISMATCH" = true ] && echo "YES ⚠️" || echo "NO ✓")
  Rate Courier: $RATE_COURIER
  Create Courier: $CREATE_COURIER

$([ "$MISMATCH" = true ] && echo "ISSUE CONFIRMED: The courier changes between rate check and shipment creation!" || echo "No issue detected - courier names are consistent.")

LOG FILES:
  - $LOG_DIR/01_rate_response.json
  - $LOG_DIR/02_create_response.json
  - $LOG_DIR/03_pay_response.json
  - $LOG_DIR/SUMMARY.txt
EOF

cat "$LOG_DIR/SUMMARY.txt"

echo -e "\n${GREEN}All logs saved to: $LOG_DIR${NC}"
echo -e "${BLUE}============================================================================${NC}"
