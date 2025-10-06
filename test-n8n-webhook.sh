#!/bin/bash

# Test n8n Webhook Direct Connection
# This script tests if your n8n webhook is responding correctly

WEBHOOK_URL="https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat"

echo "============================================"
echo "Testing n8n Webhook Connection"
echo "============================================"
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic GET request"
echo "-------------------------------------------"
curl -v "$WEBHOOK_URL" 2>&1 | grep -E "(< HTTP|< Content-Type|< Access-Control|Connection refused|Could not resolve)"
echo ""

# Test 2: POST with chat message (what the widget sends)
echo ""
echo "Test 2: POST with chat message payload"
echo "-------------------------------------------"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://ecomm2-production.up.railway.app" \
  -d '{
    "action": "sendMessage",
    "sessionId": "test-session-123",
    "chatInput": "Hello, this is a test message"
  }' \
  -v 2>&1 | head -n 50
echo ""

# Test 3: Check CORS headers
echo ""
echo "Test 3: CORS Preflight (OPTIONS request)"
echo "-------------------------------------------"
curl -X OPTIONS "$WEBHOOK_URL" \
  -H "Origin: https://ecomm2-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

echo "============================================"
echo "Test Complete"
echo "============================================"
echo ""
echo "Expected Results:"
echo "- Test 1: Should return HTTP 200 or 405"
echo "- Test 2: Should return chat response JSON"
echo "- Test 3: Should include Access-Control-Allow-Origin header"
echo ""
echo "If you see 'Connection refused' or 404, the workflow isn't active"
echo "If you see no CORS headers, you need to configure CORS in n8n"
