## Error Handling

### Error Categories

**1. Validation Errors (400)**
- Incomplete address
- Invalid phone number format
- Invalid postal code
- Missing required fields

**2. Not Found Errors (404)**
- Order not found
- Settings not configured
- Tracking number not found

**3. Business Logic Errors (422)**
- Order already fulfilled
- No couriers available for address
- Free shipping threshold not met (internal only)
- Order not in PAID status

**4. External API Errors (502/503)**
- EasyParcel API timeout
- EasyParcel API down
- Invalid API credentials
- Rate limit exceeded

**5. Server Errors (500)**
- Database connection failed
- Unexpected exception
- Configuration missing

### Error Response Format

**Standard error response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": "Additional context (optional)",
  "retryable": true/false,
  "retryAfter": 300 // seconds (optional)
}
```

### Error Handling Strategy

**Customer-Facing Errors:**
- Show friendly messages
- Provide clear next steps
- Offer alternative actions
- Hide technical details

**Admin-Facing Errors:**
- Show technical details
- Provide retry mechanisms
- Log full error context
- Suggest solutions

**Example - No Couriers Available:**
```
Customer sees:
"Sorry, we cannot ship to this address.
Please try a different address or contact us."

Admin logs:
"EasyParcel API returned 0 couriers for Sabah,
postal code 88000. Possible reasons: Remote area,
courier service limitations."
```

---
