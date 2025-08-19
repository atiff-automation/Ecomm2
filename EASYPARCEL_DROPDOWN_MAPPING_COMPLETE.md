# Complete EasyParcel Dropdown Mapping System

## 📋 Official EasyParcel Dropdown Values

### 🏷️ **CATEGORY OPTIONS** (24 options)
```
Automotive Accessories, Bags & Luggages, Bird's Nest, Board Games, Books, Cameras, 
Computers And Parts / Telecommunication Parts And Equipments, Cosmetic And Beauty Product, 
Document, Fashion And Accessories, Food Enhancers/Stabilizers/Supplements, Gaming, 
Health Supplements, Home Appliances, Home Decor, Jewelry, Non Perishable Food, 
Perishable Food, Pesticides, Pet Accessory, Plant, Sport & Leisure, Toys, Watches
```

### 🚚 **COURIER COMPANY OPTIONS** (13 options)  
```
Skynet, Poslaju, DHL eCommerce, Aramex, UTS, Qxpress, J&T Express, Flash Express, 
Ninja Van, J&T Cargo, CityLink, Best Express, KEX Express
```

### ✅ **BOOLEAN OPTIONS** (2 options)
```
Yes, No
```
- Used for: `Drop Off At Courier Branch`, `Tracking SMS`, `Tracking Whatsapp`

## 🎯 CSV Field Mapping with Real Dropdown Values

### **BUSINESS OWNER CONTROLLED FIELDS**
| CSV Field | Dropdown Source | Data Source | Example Value |
|-----------|----------------|-------------|---------------|
| **Sender Name*** | N/A | `businessProfile.pickupAddress.name` | "EcomJRM Store" |
| **Sender Company** | N/A | `businessProfile.businessName` | "EcomJRM Sdn Bhd" |
| **Sender Contact*** | N/A | `businessProfile.pickupAddress.phone` | "+60123456789" |
| **Sender Alt Contact** | N/A | `businessProfile.contactPhone` | "+60123456790" |
| **Sender Email** | N/A | `businessProfile.contactEmail` | "store@ecomjrm.com" |
| **Sender Address*** | N/A | `businessProfile.pickupAddress.address` | "No. 123, Jalan Technology" |
| **Sender Postcode*** | N/A | `businessProfile.pickupAddress.postcode` | "50000" |
| **Sender City*** | N/A | `businessProfile.pickupAddress.city` | "Kuala Lumpur" |
| **Courier Company** | ✅ Courier Dropdown | Business courier preference | "CityLink" |
| **Alternative Courier Company** | ✅ Courier Dropdown | Business backup courier | "J&T Express" |
| **Tracking SMS** | ✅ Boolean Dropdown | Business preference | "Yes" |
| **Drop Off At Courier Branch** | ✅ Boolean Dropdown | Business preference | "No" |
| **Tracking Whatsapp** | ✅ Boolean Dropdown | Business preference | "Yes" |

### **CUSTOMER ORDER FIELDS**
| CSV Field | Dropdown Source | Order Data Source | Example Value |
|-----------|----------------|-------------------|---------------|
| **Receiver Name*** | N/A | `order.user.firstName + lastName` | "John Doe" |
| **Receiver Company** | N/A | `order.shippingAddress.company` | "ABC Corp" |
| **Receiver Contact*** | N/A | `order.user.phone` OR `order.guestPhone` | "+60123456788" |
| **Receiver Alt Contact** | N/A | Not used | "" |
| **Receiver Email** | N/A | `order.user.email` OR `order.guestEmail` | "john@example.com" |
| **Receiver Address*** | N/A | `order.shippingAddress.addressLine1 + 2` | "456 Customer Street" |
| **Receiver Postcode*** | N/A | `order.shippingAddress.postalCode` | "10400" |
| **Receiver City*** | N/A | `order.shippingAddress.city` | "Georgetown" |

### **SYSTEM GENERATED FIELDS**
| CSV Field | Dropdown Source | System Logic | Example Value |
|-----------|----------------|--------------|---------------|
| **No*** | N/A | Sequential number (1, 2, 3...) | "1" |
| **Category** | ✅ Category Dropdown | Smart mapping from product name | "Fashion And Accessories" |
| **Parcel Content*** | N/A | `order.orderItems[].productName` | "T-Shirt x2, Jeans x1" |
| **Parcel Value (RM)*** | N/A | `order.subtotal` (excluding shipping) | "89.90" |
| **Weight (kg)*** | N/A | Sum of `orderItems.weight * quantity` | "0.8" |
| **Pick Up Date*** | N/A | Next business day calculation | "2025-08-18" |
| **Reference** | N/A | `order.orderNumber` | "ORD-20250817-ABC123" |

## 🤖 Smart Mapping System

### **Product Category Mapping**
The system intelligently maps product names to EasyParcel categories:

```typescript
// Example mappings
"Fashion T-Shirt" → "Fashion And Accessories"
"Gaming Mouse" → "Gaming"  
"Protein Supplement" → "Health Supplements"
"Samsung Camera" → "Cameras"
"Travel Bag" → "Bags & Luggages"
"Organic Snacks" → "Non Perishable Food"
```

### **Courier Code Mapping**  
Internal courier codes are mapped to official EasyParcel names:

```typescript
// Example mappings
"citylink" → "CityLink"
"jnt" → "J&T Express"
"poslaju" → "Poslaju"
"ninja_van" → "Ninja Van"
"flash" → "Flash Express"
```

## 🔧 Business Configuration Integration

### **Default Settings**
```typescript
{
  category: "Fashion And Accessories",    // Most general
  courier: "CityLink",                   // Popular & reliable
  trackingSms: "Yes",                    // Enable notifications
  dropOffAtBranch: "No",                 // Prefer pickup service
  trackingWhatsapp: "Yes"                // Enable WhatsApp tracking
}
```

### **Business Profile Requirements**
For CSV export to work properly:

```typescript
{
  businessName: "EcomJRM Sdn Bhd",           // → Sender Company
  pickupAddress: {
    name: "EcomJRM Store",                   // → Sender Name*
    phone: "+60123456789",                   // → Sender Contact*
    address_line_1: "No. 123, Jalan Tech",  // → Sender Address*
    city: "Kuala Lumpur",                    // → Sender City*
    postcode: "50000",                       // → Sender Postcode*
  },
  courierPreferences: {
    preferredCouriers: ["citylink", "jnt"]   // → Courier mappings
  }
}
```

## ✅ Validation System

The system validates all dropdown values against official EasyParcel options:

### **Category Validation**
- ✅ Must be one of 24 official categories
- ✅ Smart fallback to "Fashion And Accessories"
- ✅ Product name keyword detection

### **Courier Validation**  
- ✅ Must be one of 13 official courier names
- ✅ Maps internal codes to official names
- ✅ Business preference integration

### **Boolean Options Validation**
- ✅ Must be exactly "Yes" or "No"
- ✅ Used for service preferences
- ✅ Business defaults applied

## 🎯 Export Process with Dropdown Values

1. **Load Business Profile** → Sender information + preferences
2. **Fetch Order Data** → Receiver information
3. **Smart Category Mapping** → Product name → EasyParcel category
4. **Courier Name Mapping** → Internal code → Official courier name
5. **Apply Business Defaults** → Service preferences (Yes/No options)
6. **Validate All Dropdowns** → Ensure compliance with EasyParcel
7. **Generate Clean CSV** → Ready for EasyParcel bulk upload

## 📊 Coverage Summary

### **Total Fields**: 28
- **🏢 Owner Controlled**: 13 fields (sender + service preferences)
- **👤 Customer Data**: 8 fields (receiver information)  
- **📦 System Generated**: 7 fields (parcel + reference data)

### **Dropdown Integration**: 5 fields
- **Category**: 1 field with 24 options (smart mapped)
- **Courier**: 2 fields with 13 options (business mapped)
- **Service Options**: 3 fields with Yes/No (business defaults)

### **Data Validation**: 100%
- ✅ All required fields validated
- ✅ All dropdown values validated against official options
- ✅ Business profile completeness checked
- ✅ Malaysian format compliance (phone, postal codes)

## 🚀 Ready for Production

The system now provides:
- ✅ **Exact EasyParcel compatibility** with official dropdown values
- ✅ **Smart product categorization** from product names
- ✅ **Business-controlled preferences** for service options
- ✅ **Clean data separation** between owner and customer data
- ✅ **Comprehensive validation** ensuring successful uploads
- ✅ **Zero configuration exports** with intelligent defaults

The CSV files generated are now 100% compatible with EasyParcel's bulk upload system and use only official dropdown values from their platform.