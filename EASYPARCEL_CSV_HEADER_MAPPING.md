# EasyParcel CSV Header Mapping

## Header Structure Analysis
Based on EasyParcel_Bulk_Template[MY_9.12].xlsx

### Complete Header List (28 fields)
```
No*, Category, Parcel Content*, Parcel Value (RM)*, Weight (kg)*, Pick Up Date*, 
Sender Name*, Sender Company, Sender Contact*, Sender Alt Contact, Sender Email, 
Sender Address*, Sender Postcode*, Sender City*, 
Receiver Name*, Receiver Company, Receiver Contact*, Receiver Alt Contact, Receiver Email, 
Receiver Address*, Receiver Postcode*, Receiver City*, 
Courier Company, Alternative Courier Company, Tracking SMS, Drop Off At Courier Branch, 
Reference, Tracking Whatsapp
```

## Data Source Mapping

### 🏢 BUSINESS OWNER DATA (Sender Information)
*Source: Business Profile Configuration*

| Field | Required | Data Source | Example |
|-------|----------|-------------|---------|
| **Sender Name*** | ✅ | `businessProfile.pickupAddress.name` | "EcomJRM Store" |
| **Sender Company** | ❌ | `businessProfile.businessName` | "EcomJRM Sdn Bhd" |
| **Sender Contact*** | ✅ | `businessProfile.pickupAddress.phone` | "+60123456789" |
| **Sender Alt Contact** | ❌ | `businessProfile.contactPhone` | "+60123456790" |
| **Sender Email** | ❌ | `businessProfile.contactEmail` | "store@ecomjrm.com" |
| **Sender Address*** | ✅ | `businessProfile.pickupAddress.address_line_1 + address_line_2` | "No. 123, Jalan Technology, Level 5" |
| **Sender Postcode*** | ✅ | `businessProfile.pickupAddress.postcode` | "50000" |
| **Sender City*** | ✅ | `businessProfile.pickupAddress.city` | "Kuala Lumpur" |

### 👤 CUSTOMER DATA (Receiver Information)
*Source: Order Shipping Address & Customer Info*

| Field | Required | Data Source | Example |
|-------|----------|-------------|---------|
| **Receiver Name*** | ✅ | `user.firstName + lastName` OR `shippingAddress.name` | "John Doe" |
| **Receiver Company** | ❌ | `shippingAddress.company` | "ABC Corp" |
| **Receiver Contact*** | ✅ | `user.phone` OR `guestPhone` | "+60123456788" |
| **Receiver Alt Contact** | ❌ | Custom field (future) | "+60123456787" |
| **Receiver Email** | ❌ | `user.email` OR `guestEmail` | "john@example.com" |
| **Receiver Address*** | ✅ | `shippingAddress.addressLine1 + addressLine2` | "456 Customer Street, Apt 2B" |
| **Receiver Postcode*** | ✅ | `shippingAddress.postalCode` | "10400" |
| **Receiver City*** | ✅ | `shippingAddress.city` | "Georgetown" |

### 📦 PARCEL DATA (System Generated)
*Source: Order Items & System Calculations*

| Field | Required | Data Source | Example |
|-------|----------|-------------|---------|
| **No*** | ✅ | Auto-increment sequence | "1", "2", "3" |
| **Category** | ❌ | Default: "General" | "General" |
| **Parcel Content*** | ✅ | Concatenated `orderItems.productName` | "T-Shirt x2, Jeans x1" |
| **Parcel Value (RM)*** | ✅ | `order.subtotal` (excluding shipping) | "89.90" |
| **Weight (kg)*** | ✅ | Sum of `orderItems.product.weight * quantity` | "0.8" |
| **Pick Up Date*** | ✅ | Next business day | "2025-08-18" |

### ⚙️ SERVICE OPTIONS (Business Configuration)
*Source: Business Shipping Preferences*

| Field | Required | Data Source | Example |
|-------|----------|-------------|---------|
| **Courier Company** | ❌ | `businessProfile.courierPreferences.preferredCouriers[0]` | "citylink" |
| **Alternative Courier Company** | ❌ | `businessProfile.courierPreferences.preferredCouriers[1]` | "poslaju" |
| **Tracking SMS** | ❌ | Default: "Yes" | "Yes" |
| **Drop Off At Courier Branch** | ❌ | Default: "No" (pickup service) | "No" |
| **Reference** | ❌ | `order.orderNumber` | "ORD-20250817-ABC123" |
| **Tracking Whatsapp** | ❌ | Default: "Yes" | "Yes" |

## Required vs Optional Fields

### ✅ CRITICAL REQUIRED FIELDS (Must be filled)
1. **No*** - Auto-generated sequence
2. **Parcel Content*** - Product descriptions
3. **Parcel Value (RM)*** - Order value
4. **Weight (kg)*** - Total weight
5. **Pick Up Date*** - Business day scheduling
6. **Sender Name*** - Business name
7. **Sender Contact*** - Business phone
8. **Sender Address*** - Business address
9. **Sender Postcode*** - Business postcode
10. **Sender City*** - Business city
11. **Receiver Name*** - Customer name
12. **Receiver Contact*** - Customer phone
13. **Receiver Address*** - Customer address
14. **Receiver Postcode*** - Customer postcode
15. **Receiver City*** - Customer city

### ❓ OPTIONAL ENHANCEMENT FIELDS
- Category, Company fields, Alt contacts, Emails
- Courier selection, Service options
- Tracking preferences

## Data Validation Rules

### Phone Numbers
- Format: `+60XXXXXXXXX` or `0XXXXXXXXX`
- Malaysian mobile/landline patterns
- Clean spaces and dashes for validation

### Postal Codes
- Format: `XXXXX` (5 digits)
- Malaysian postal code validation

### Addresses
- Complete address lines required
- Malaysian state codes mapping
- City names standardization

### Weight & Dimensions
- Minimum: 0.1kg
- Maximum: 70kg (EasyParcel limit)
- Default: 0.5kg per item if not specified

### Content Description
- Maximum 100 characters
- Comma-separated product list
- Quantity indicators

## Business Profile Requirements

For successful CSV export, business profile must contain:

```typescript
{
  businessName: string;           // Required for Sender Company
  contactPerson: string;          // Optional
  contactPhone: string;           // Required for Sender Alt Contact
  contactEmail: string;           // Required for Sender Email
  pickupAddress: {
    name: string;                 // Required for Sender Name
    phone: string;                // Required for Sender Contact
    email: string;                // Optional
    address_line_1: string;       // Required for Sender Address
    address_line_2?: string;      // Optional, appended to address
    city: string;                 // Required for Sender City
    state: string;                // Used for state code mapping
    postcode: string;             // Required for Sender Postcode
    country: string;              // Should be "MY"
  };
  courierPreferences: {
    preferredCouriers: string[];  // For Courier Company selection
    defaultServiceType: string;  // Service level preference
  };
}
```

## Export Process Flow

1. **Initialize Business Profile** - Load or use default
2. **Fetch Orders** - Filter by status/payment
3. **Transform Data** - Map each order to CSV row
4. **Validate Fields** - Check required fields
5. **Generate CSV** - Format and export
6. **Download/Upload** - Ready for EasyParcel

## Future Enhancements

- State-specific courier preferences
- Weight-based service selection
- Insurance calculation rules
- COD amount mapping
- Delivery time preferences
- Special handling instructions