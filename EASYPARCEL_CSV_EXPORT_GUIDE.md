# EasyParcel CSV Export Fallback System

## Overview

This system provides a comprehensive fallback solution for EasyParcel shipping when the API is unavailable or experiencing issues. It exports orders in EasyParcel's bulk upload CSV format, allowing you to manually upload shipments to EasyParcel's website.

## 🚀 Quick Start

1. **Access the CSV Export Interface**
   ```
   Navigate to: Admin → Shipping Management → CSV Export
   Or directly: /admin/shipping/csv-export
   ```

2. **Configure Export Filters**
   - Select order status (recommended: CONFIRMED, PROCESSING)
   - Select payment status (recommended: PAID)
   - Set date range if needed
   - Choose export options

3. **Preview and Export**
   - Click "Preview Export" to review orders
   - Click "Download CSV" when ready
   - Upload the CSV file to EasyParcel's website

## 📋 Features

### ✅ Complete Order Transformation
- **Sender Details**: Automatically populated from business configuration
- **Receiver Details**: Customer shipping addresses from orders
- **Parcel Details**: Calculated from order items (weight, dimensions, value)
- **Service Preferences**: Uses your business courier preferences

### ✅ Data Validation
- Required field validation
- Malaysian phone number format checking
- Postal code validation
- Address completeness verification
- Weight and dimension limits

### ✅ Business Integration
- Uses existing business shipping configuration
- Applies courier preferences and filtering
- Respects shipping policies and settings
- Maintains consistent branding and contact info

### ✅ Export Options
- Filter by order status and payment status
- Date range filtering
- Individual order selection
- CSV header inclusion/exclusion
- Validation level control

## 🏗️ System Architecture

### Core Components

1. **EasyParcelCSVExporter** (`src/lib/shipping/easyparcel-csv-exporter.ts`)
   - Main service class for CSV generation
   - Order data transformation
   - Business configuration integration

2. **CSV Export API** (`src/app/api/admin/shipping/export/easyparcel-csv/route.ts`)
   - RESTful API for CSV export operations
   - Preview and export endpoints
   - Authentication and authorization

3. **Admin Interface** (`src/app/admin/shipping/csv-export/page.tsx`)
   - User-friendly export configuration
   - Real-time preview
   - Batch order selection

4. **Validation System** (`src/lib/shipping/easyparcel-csv-validator.ts`)
   - Comprehensive validation rules
   - EasyParcel format compliance
   - Error reporting and warnings

### API Endpoints

```typescript
// Get export statistics and configuration
GET /api/admin/shipping/export/easyparcel-csv

// Preview export (returns sample data)
POST /api/admin/shipping/export/easyparcel-csv
{
  "action": "preview",
  "filters": { /* filter options */ },
  "options": { /* export options */ }
}

// Download CSV export
POST /api/admin/shipping/export/easyparcel-csv
{
  "action": "export", 
  "filters": { /* filter options */ },
  "options": { /* export options */ }
}
```

## 📄 CSV Format Specification

The exported CSV follows EasyParcel's bulk upload template with these fields:

### Sender Information (Business Profile)
- `pick_name` - Business name
- `pick_mobile` - Business phone
- `pick_addr` - Business address
- `pick_city` - Business city
- `pick_code` - Business postal code
- `pick_state` - Business state (Malaysian code)
- `pick_country` - "MY"

### Receiver Information (Customer)
- `send_name` - Customer name
- `send_mobile` - Customer phone
- `send_addr` - Customer address
- `send_city` - Customer city
- `send_code` - Customer postal code
- `send_state` - Customer state (Malaysian code)
- `send_country` - "MY"

### Parcel Information
- `weight` - Total weight in KG
- `length` - Package length in CM (optional)
- `width` - Package width in CM (optional)
- `height` - Package height in CM (optional)
- `content` - Package description
- `value` - Declared value in MYR

### Service Options
- `courier` - Preferred courier (from business settings)
- `service_type` - Service level (standard/express/overnight)
- `insurance` - Insurance option (yes/no)
- `cod_amount` - COD amount (if applicable)

### Reference Information
- `reference` - Order number
- `remarks` - Additional instructions

## 🔧 Configuration

### Business Profile Setup
Before using CSV export, ensure your business profile is configured:

1. Navigate to **Admin → Shipping → Business Config**
2. Complete all required fields:
   - Business name and contact information
   - Pickup address (acts as sender address)
   - Operating hours
   - Courier preferences
   - Shipping policies

### API/CSV Mode Toggle
Switch between API and CSV modes:

```typescript
// Set CSV mode
POST /api/admin/shipping/mode
{
  "mode": "csv",
  "reason": "API unavailable"
}

// Set API mode  
POST /api/admin/shipping/mode
{
  "mode": "api",
  "reason": "API restored"
}
```

## 📝 Usage Workflow

### 1. Filter and Select Orders
```typescript
// Recommended filters for shipping
{
  "status": ["CONFIRMED", "PROCESSING"],
  "paymentStatus": ["PAID"],
  "dateFrom": "2025-08-01",
  "dateTo": "2025-08-31"
}
```

### 2. Preview Before Export
- Review order count and estimated file size
- Check validation warnings
- Verify customer information completeness
- Confirm parcel details accuracy

### 3. Export and Upload
- Download CSV file with timestamp
- Log into EasyParcel website
- Use their bulk upload feature
- Upload the CSV file
- Process shipments through their interface

### 4. Track and Monitor
- Note tracking numbers from EasyParcel
- Update order status in your system
- Monitor delivery progress

## ⚠️ Important Considerations

### Data Requirements
- **Business profile must be configured** - Required for sender information
- **Complete shipping addresses** - All customer addresses must be complete
- **Valid phone numbers** - Malaysian format required (+60XXXXXXXXX)
- **Accurate weights** - Products should have weight information
- **Postal codes** - Must be valid 5-digit Malaysian postal codes

### Limitations
- **Manual process** - Requires manual upload to EasyParcel
- **No real-time tracking** - Tracking updates not automatic
- **Batch processing** - Best for bulk operations
- **No rate calculation** - Uses business default settings

### Best Practices
- **Export in batches** - Limit to 100-500 orders per export
- **Validate before upload** - Always preview and check for errors
- **Keep records** - Save CSV files for reference
- **Regular exports** - Don't let orders accumulate

## 🐛 Troubleshooting

### Common Issues

1. **"Business profile not configured"**
   - Solution: Complete business configuration in Admin → Shipping → Business Config

2. **"Invalid phone number format"**
   - Solution: Ensure phone numbers are in Malaysian format (+60XXXXXXXXX)

3. **"Shipping address incomplete"**
   - Solution: Check orders have complete shipping addresses

4. **"Parcel weight missing"**
   - Solution: Update product weights in catalog

5. **"Invalid postal code"**
   - Solution: Verify 5-digit Malaysian postal codes

### Validation Errors

The system provides detailed validation reports:
- **Critical errors** - Must be fixed before export
- **Warnings** - Should be reviewed but not blocking
- **Success rate** - Percentage of orders that will process successfully

### Export Failures

If CSV export fails:
1. Check server logs for detailed error messages
2. Verify business profile configuration
3. Reduce export batch size
4. Check database connectivity
5. Contact system administrator

## 🔄 Integration with Main System

### Shipping Mode Toggle
The system automatically detects when to use CSV vs API mode:
- **API Mode**: When EasyParcel API is configured and working
- **CSV Mode**: When API is unavailable or explicitly set

### Business Configuration Integration
- Pickup address from business profile
- Courier preferences applied to exports
- Shipping policies respected
- Insurance and COD settings integrated

### Order Management Integration
- Exports orders from existing database
- Respects order status filters
- Includes all customer and product data
- Maintains order reference numbers

## 📊 Monitoring and Analytics

### Export Statistics
- Total orders available for export
- Orders ready to ship (paid and confirmed)
- Processing orders
- Recent order trends

### Validation Metrics
- Success rate of exports
- Common validation errors
- Data completeness statistics
- Export volume trends

### Performance Monitoring
- Export processing time
- File size estimates
- Error rates
- User activity logs

## 🚀 Future Enhancements

### Planned Improvements
- **Automated upload integration** - Direct upload to EasyParcel API when available
- **Tracking synchronization** - Automatic tracking number updates
- **Smart batching** - Intelligent order grouping
- **Enhanced validation** - More comprehensive checks
- **Export scheduling** - Automated periodic exports

### API Integration Fallback
- Seamless switching between CSV and API modes
- Automatic failover when API issues detected
- Real-time status monitoring
- Progressive enhancement approach

This CSV export system provides a robust, reliable fallback solution that maintains full functionality even when the EasyParcel API is unavailable, ensuring your shipping operations never stop.