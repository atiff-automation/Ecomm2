# Receipt Template Implementation Plan

## Executive Summary

This document outlines the implementation plan for a receipt template selection and settings system for the JRM E-commerce platform. The system will allow administrators to configure receipt templates that will be used for customer purchase receipts and documentation purposes.

## Current Architecture Analysis

### Existing Components
- **Settings System**: Well-structured with `SettingsForm.tsx`, `SettingsTabs.tsx`, and `settingsConfig.ts`
- **Receipt System**: Already exists with `TaxReceiptViewer.tsx` and `receipt-service.ts`
- **Database Models**: `BusinessProfile`, `TaxConfiguration`, and `SystemConfig` tables available
- **Settings Tabs**: Currently has Business Profile, Tax Configuration, and Site Customization

### Existing Receipt Infrastructure
- `TaxReceiptService` with HTML template generation
- Template uses hardcoded styling and company information
- Current template is receipt-style (thermal printer format)
- Company info sourced from environment variables

## Proposed Architecture

### 1. Database Schema Enhancement

**New Model: `ReceiptTemplate`**
```prisma
model ReceiptTemplate {
  id               String   @id @default(cuid())
  name             String
  description      String?
  templateType     ReceiptTemplateType
  templateContent  Json     // Template configuration
  isDefault        Boolean  @default(false)
  isActive         Boolean  @default(true)
  previewImage     String?  // Optional preview image
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  createdBy        String
  updatedBy        String?

  @@index([templateType])
  @@index([isDefault, isActive])
  @@map("receipt_templates")
}

enum ReceiptTemplateType {
  THERMAL_RECEIPT    // Current receipt style
  BUSINESS_INVOICE   // Formal invoice style
  MINIMAL_RECEIPT    // Clean minimal style
  DETAILED_INVOICE   // Detailed business invoice
}
```

**Enhanced `SystemConfig` Usage**
- `receipt_default_template_id`: ID of default template
- `receipt_company_logo_enabled`: Boolean for logo display
- `receipt_footer_message`: Custom footer message

### 2. Component Architecture

```
src/components/settings/receipt-templates/
├── ReceiptTemplateManager.tsx      # Main management component
├── TemplateSelector.tsx            # Template selection UI
├── TemplatePreview.tsx             # Live preview component
├── TemplateEditor.tsx              # Template customization
├── CompanyInfoEditor.tsx           # Company details form
└── TemplateGallery.tsx             # Pre-built template gallery
```

### 3. Service Layer Enhancement

**Enhanced Receipt Service**
```typescript
// src/lib/receipts/template-service.ts
export class ReceiptTemplateService {
  // Template management
  async getAvailableTemplates()
  async getActiveTemplate()
  async setDefaultTemplate(templateId: string)
  
  // Template rendering
  async renderTemplate(templateId: string, receiptData: TaxReceiptData)
  async generatePreview(templateId: string, sampleData?: Partial<TaxReceiptData>)
  
  // Template validation
  async validateTemplate(templateContent: Json)
}
```

## Implementation Plan

### Phase 1: Database & Core Services (Week 1)

#### 1.1 Database Migration
- [ ] Create `ReceiptTemplate` model
- [ ] Add new `ReceiptTemplateType` enum
- [ ] Create migration with default templates
- [ ] Update SystemConfig with receipt-related keys

#### 1.2 Template Service
- [ ] Create `ReceiptTemplateService`
- [ ] Implement template CRUD operations
- [ ] Add template validation logic
- [ ] Create sample template data

#### 1.3 Template Engine
- [ ] Design template configuration schema
- [ ] Implement template rendering engine
- [ ] Create template variable injection system
- [ ] Add template compilation logic

### Phase 2: Settings UI Components (Week 2)

#### 2.1 Settings Tab Integration
- [ ] Add "Receipt Templates" tab to settings config
- [ ] Update `SettingsTabs` component
- [ ] Create main settings page route

#### 2.2 Template Management UI
- [ ] Create `ReceiptTemplateManager` component
- [ ] Implement template listing and selection
- [ ] Add template activation/deactivation
- [ ] Build template deletion with confirmation

#### 2.3 Template Preview System
- [ ] Create `TemplatePreview` component
- [ ] Implement live preview with sample data
- [ ] Add responsive preview modes
- [ ] Integrate with template selector

### Phase 3: Template Customization (Week 3)

#### 3.1 Company Information Editor
- [ ] Create `CompanyInfoEditor` component
- [ ] Integrate with business profile data
- [ ] Add logo upload functionality
- [ ] Implement validation and saving

#### 3.2 Template Gallery
- [ ] Create `TemplateGallery` component
- [ ] Add pre-built template options:
   - Thermal Receipt (current)
   - Business Invoice
   - Minimal Receipt
   - Detailed Invoice
- [ ] Implement template preview thumbnails
- [ ] Add template selection and installation

#### 3.3 Basic Template Editor
- [ ] Create `TemplateEditor` component
- [ ] Add color scheme customization
- [ ] Implement font and sizing options
- [ ] Add header/footer customization

### Phase 4: Integration & Testing (Week 4)

#### 4.1 Service Integration
- [ ] Update existing `TaxReceiptService`
- [ ] Integrate with new template system
- [ ] Maintain backward compatibility
- [ ] Add template caching for performance

#### 4.2 API Endpoints
- [ ] Create template management API routes
- [ ] Add template preview endpoints
- [ ] Implement template export/import
- [ ] Add validation endpoints

#### 4.3 Testing & Validation
- [ ] Unit tests for template service
- [ ] Integration tests for receipt generation
- [ ] UI testing for template selection
- [ ] Performance testing with large templates

## Template Structure Design

### Template Configuration Schema
```json
{
  "templateType": "BUSINESS_INVOICE",
  "layout": {
    "pageSize": "A4",
    "margins": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
  },
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#F8FAFC",
    "text": "#1E293B",
    "accent": "#FDE047"
  },
  "typography": {
    "fontFamily": "Arial",
    "fontSize": { "normal": 14, "small": 12, "large": 16 }
  },
  "sections": {
    "header": {
      "enabled": true,
      "showLogo": true,
      "showCompanyInfo": true,
      "alignment": "center"
    },
    "customer": {
      "enabled": true,
      "showMemberBadge": true,
      "showBillingAddress": false
    },
    "items": {
      "enabled": true,
      "showSKU": true,
      "showDescription": true
    },
    "totals": {
      "enabled": true,
      "showTaxBreakdown": true,
      "showDiscount": true
    },
    "footer": {
      "enabled": true,
      "message": "Thank you for your business!",
      "showGeneratedDate": true
    }
  }
}
```

### Pre-built Templates

#### 1. Thermal Receipt (Current)
- Compact 400px width
- Monospace font
- Dashed borders
- Minimal styling

#### 2. Business Invoice
- A4 format
- Professional styling
- Company branding
- Detailed layout

#### 3. Minimal Receipt
- Clean modern design
- Sans-serif fonts
- Subtle colors
- Mobile-friendly

#### 4. Detailed Invoice
- Comprehensive layout
- Tax compliance focused
- Multiple address sections
- Professional appearance

## Technical Specifications

### File Structure
```
src/
├── components/settings/receipt-templates/
├── lib/receipts/
│   ├── template-service.ts
│   ├── template-engine.ts
│   └── receipt-service.ts (enhanced)
├── app/admin/settings/receipt-templates/
│   ├── page.tsx
│   └── components/
└── types/receipt-templates.ts
```

### Database Migration Script
```sql
-- Create receipt templates table
CREATE TABLE "receipt_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "templateType" "ReceiptTemplateType" NOT NULL,
  "templateContent" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "previewImage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT
);

-- Create indices
CREATE INDEX "receipt_templates_templateType_idx" ON "receipt_templates"("templateType");
CREATE INDEX "receipt_templates_isDefault_isActive_idx" ON "receipt_templates"("isDefault", "isActive");
```

## Implementation Guidelines

### Code Standards
1. **TypeScript Strict Mode**: All components must be fully typed
2. **Component Architecture**: Follow existing patterns in settings components
3. **Error Handling**: Comprehensive error handling with user feedback
4. **Accessibility**: WCAG 2.1 AA compliance for all UI components
5. **Testing**: Minimum 80% code coverage
6. **Performance**: Templates must render in <200ms

### Security Considerations
1. **Input Validation**: All template content must be sanitized
2. **XSS Protection**: Template rendering must prevent script injection
3. **Access Control**: Only admin users can modify templates
4. **Audit Trail**: All template changes must be logged

### UX Guidelines
1. **Progressive Enhancement**: Basic functionality works without JS
2. **Responsive Design**: All components work on mobile devices
3. **Loading States**: Show progress during template operations
4. **Error Recovery**: Clear error messages with recovery actions
5. **Accessibility**: Screen reader compatible

## Risk Assessment & Mitigation

### High Risk
- **Template Rendering Performance**: Large templates may cause slowdowns
  - *Mitigation*: Implement template caching and pagination
  
- **Data Migration**: Existing receipts must remain accessible
  - *Mitigation*: Maintain backward compatibility with current system

### Medium Risk
- **Template Validation**: Invalid templates could break receipt generation
  - *Mitigation*: Comprehensive validation and sandboxing
  
- **User Experience**: Complex template editor may confuse users
  - *Mitigation*: Provide pre-built templates and guided setup

### Low Risk
- **Storage Requirements**: Template storage may increase database size
  - *Mitigation*: Implement template compression and archival

## Success Metrics

### Technical Metrics
- [ ] Template rendering time < 200ms
- [ ] Zero downtime deployment
- [ ] 100% backward compatibility maintained
- [ ] API response times < 100ms

### User Experience Metrics
- [ ] Template selection completion rate > 90%
- [ ] User satisfaction score > 4.5/5
- [ ] Support ticket reduction by 30%
- [ ] Admin setup time < 10 minutes

## Rollback Plan

### Emergency Rollback
1. Disable new template system via feature flag
2. Revert to hardcoded template in `receipt-service.ts`
3. Maintain database integrity
4. Preserve user settings

### Gradual Rollback
1. Allow existing templates to continue working
2. Prevent new template creation
3. Provide migration path back to defaults
4. Export user configurations for later restoration

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| 1 | Week 1 | Database schema, core services, template engine |
| 2 | Week 2 | Settings UI, template management, preview system |
| 3 | Week 3 | Template gallery, customization, editor |
| 4 | Week 4 | Integration, API endpoints, testing |

**Total Timeline**: 4 weeks
**Ready for Production**: End of Week 4
**Full Feature Rollout**: Week 5

## Next Steps

1. **Approval Required**: Review and approve this implementation plan
2. **Resource Allocation**: Assign development resources for 4-week sprint
3. **Design Review**: Finalize UI/UX designs for template components
4. **Database Review**: Review and approve database schema changes
5. **Start Implementation**: Begin with Phase 1 development

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Next Review**: Before implementation start  
**Status**: Awaiting Approval