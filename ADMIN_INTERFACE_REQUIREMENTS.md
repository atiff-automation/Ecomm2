# Admin Interface Requirements: Smart Shipping System

## Overview

This document defines comprehensive user interface requirements for the admin dashboard of the smart zone-based shipping system, focusing on intuitive shipping rule management, system monitoring, and operational efficiency.

## Design Philosophy

### User-Centered Design Principles
1. **Simplicity First**: Complex shipping logic presented through simple, intuitive interfaces
2. **Context-Aware**: Show relevant information based on current user task and system state
3. **Efficiency-Focused**: Minimize clicks and cognitive load for frequent operations
4. **Error Prevention**: Guide users away from mistakes through clear validation and feedback
5. **Mobile-Responsive**: Full functionality across desktop, tablet, and mobile devices

### User Personas

#### Primary Admin (Sarah - Operations Manager)
- **Role**: Daily shipping operations management
- **Goals**: Quick rate updates, bulk operations, system monitoring
- **Technical Level**: Medium - comfortable with web interfaces
- **Key Tasks**: Rate adjustments, CSV processing, customer support

#### Super Admin (Mike - IT Manager) 
- **Role**: System configuration and troubleshooting
- **Goals**: System health monitoring, integration management, user access control
- **Technical Level**: High - understands technical details
- **Key Tasks**: API configuration, system monitoring, user management

#### Business Owner (Lisa - CEO)
- **Role**: Strategic oversight and profitability analysis
- **Goals**: Cost analysis, profit margins, strategic decisions
- **Technical Level**: Low - needs executive summaries
- **Key Tasks**: Financial reports, performance overview, strategic planning

## Information Architecture

### Navigation Structure

```
┌─ Dashboard (Landing Page)
│  ├─ System Health Overview
│  ├─ Key Metrics Summary
│  ├─ Recent Activity Feed
│  └─ Quick Actions Panel
│
├─ Shipping Management
│  ├─ Zone Configuration
│  │  ├─ Zone List & Management
│  │  ├─ State Assignment
│  │  └─ Zone Performance Analytics
│  │
│  ├─ Rate Management
│  │  ├─ Rate Matrix Editor
│  │  ├─ Bulk Rate Operations
│  │  ├─ Rate History & Audit
│  │  └─ Rate Templates
│  │
│  └─ Rule Sets
│     ├─ Standard Rates
│     ├─ Promotional Rates
│     ├─ Seasonal Adjustments
│     └─ Emergency Rates
│
├─ Fulfillment System
│  ├─ API/CSV Settings
│  │  ├─ Decision Rules Configuration
│  │  ├─ Cost Budget Management
│  │  └─ Notification Settings
│  │
│  ├─ System Monitoring
│  │  ├─ API Health Dashboard
│  │  ├─ CSV Processing Queue
│  │  └─ Performance Metrics
│  │
│  └─ Integration Management
│     ├─ EasyParcel Configuration
│     ├─ Webhook Management
│     └─ Courier Services
│
├─ Analytics & Reports
│  ├─ Shipping Analytics
│  │  ├─ Cost vs Revenue Analysis
│  │  ├─ Zone Performance Reports
│  │  └─ Customer Shipping Patterns
│  │
│  ├─ Operational Reports
│  │  ├─ API Usage & Costs
│  │  ├─ CSV Processing Analytics
│  │  └─ System Performance Reports
│  │
│  └─ Business Intelligence
│     ├─ Profit Margin Analysis
│     ├─ Competitive Analysis
│     └─ Trend Forecasting
│
└─ System Settings
   ├─ User Management
   ├─ Security Settings
   ├─ System Configuration
   └─ Backup & Maintenance
```

## Page-by-Page Specifications

### 1. Dashboard (Landing Page)

#### Layout Requirements
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Navigation | User Profile | Notifications    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ System Health   │ │ Today's Stats   │ │ Cost Summary    │ │
│ │ ● API: Healthy  │ │ 247 Orders      │ │ Budget: 73%     │ │
│ │ ● CSV: 3 Pending│ │ API: 198 (80%)  │ │ Saved: RM 2,341 │ │
│ │ ● Alerts: 0     │ │ CSV: 49 (20%)   │ │ Spent: RM 892   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Recent Activity                                         │ │
│ │ • 14:32 - Bulk rate update: +5% for East Malaysia      │ │
│ │ • 13:15 - CSV batch processed: 23 orders completed     │ │
│ │ • 12:45 - API degraded performance detected            │ │
│ │ • 11:30 - New shipping rule set activated              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Quick Actions                                           │ │
│ │ [Update Rates] [Process CSV] [View Alerts] [Reports]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Key Components

**System Health Widget**
```typescript
interface SystemHealthWidget {
  apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  csvPendingCount: number;
  activeAlerts: Alert[];
  lastUpdated: Date;
  responseTime: number;
  uptime: number;
}
```

**Performance Metrics Card**
```typescript
interface PerformanceMetrics {
  todayOrders: {
    total: number;
    apiProcessed: number;
    csvProcessed: number;
    apiPercentage: number;
  };
  avgProcessingTime: {
    api: number;
    csv: number;
  };
  successRates: {
    api: number;
    csv: number;
  };
}
```

**Cost Summary Widget**
```typescript
interface CostSummary {
  monthlyBudget: number;
  currentSpend: number;
  budgetUsedPercentage: number;
  projectedMonthlySpend: number;
  costSavings: number;
  costPerOrder: number;
}
```

### 2. Zone Management Interface

#### Zone List View

```
┌─────────────────────────────────────────────────────────────┐
│ Shipping Zones Management                    [+ Add Zone]   │
├─────────────────────────────────────────────────────────────┤
│ Search: [_______________] Filter: [All] Sort: [Name ↑]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Peninsular Malaysia ──────────────────────┬─ Actions ──┐ │
│ │ Code: PENINSULAR  Multiplier: 1.0x        │ [Edit]     │ │
│ │ States: 12  Orders: 1,247  Revenue: RM 8K │ [Duplicate]│ │
│ │ ● Active  ⚡ 1-3 days delivery              │ [Archive]  │ │
│ └────────────────────────────────────────────┴────────────┘ │
│                                                             │
│ ┌─ East Malaysia ────────────────────────────┬─ Actions ──┐ │
│ │ Code: EAST_MALAYSIA  Multiplier: 1.5x     │ [Edit]     │ │
│ │ States: 3  Orders: 342  Revenue: RM 3.2K  │ [Duplicate]│ │
│ │ ● Active  ⚡ 3-7 days delivery              │ [Archive]  │ │
│ └────────────────────────────────────────────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Zone Editor Modal

```typescript
interface ZoneEditorProps {
  mode: 'create' | 'edit';
  zone?: ShippingZone;
  onSave: (zone: ShippingZoneInput) => Promise<void>;
  onCancel: () => void;
}

interface ZoneEditorForm {
  basic: {
    name: string;
    code: string;
    description: string;
    multiplier: number;
    isActive: boolean;
  };
  delivery: {
    timeMin: number;
    timeMax: number;
    features: string[];
  };
  states: {
    assigned: string[];
    available: string[];
  };
  performance: {
    orderCount: number;
    revenue: number;
    avgDeliveryTime: number;
  };
}
```

**State Assignment Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ State Assignment for Peninsular Malaysia                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Available States          Assigned States                   │
│ ┌─────────────────┐      ┌─────────────────────────────┐    │
│ │ □ Sabah (SBH)   │ ──► │ ☑ Johor (JOH)              │    │
│ │ □ Sarawak (SWK) │     │ ☑ Kedah (KDH)              │    │
│ │ □ Labuan (LBN)  │     │ ☑ Kelantan (KTN)           │    │
│ │                 │     │ ☑ Melaka (MLK)             │    │
│ │                 │     │ ☑ Negeri Sembilan (NSN)    │    │
│ │                 │     │ ☑ Pahang (PHG)             │    │
│ │                 │     │ ☑ Perak (PRK)              │    │
│ │                 │     │ ☑ Perlis (PLS)             │    │
│ │                 │     │ ☑ Pulau Pinang (PNG)       │    │
│ │                 │     │ ☑ Kuala Lumpur (KUL)       │    │
│ │                 │     │ ☑ Terengganu (TRG)         │    │
│ │                 │     │ ☑ Selangor (SEL)           │    │
│ └─────────────────┘     └─────────────────────────────┘    │
│                                                             │
│ [Bulk Assign] [Bulk Remove] [Reset] [Validate Coverage]    │
└─────────────────────────────────────────────────────────────┘
```

### 3. Rate Management Interface

#### Rate Matrix Editor

```
┌─────────────────────────────────────────────────────────────┐
│ Shipping Rate Matrix                  Rule Set: [Standard ▼]│
├─────────────────────────────────────────────────────────────┤
│ [Bulk Edit] [Import CSV] [Export] [Copy Rates] [History]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Weight Range   │ Peninsular Malaysia │ East Malaysia       │
│ ────────────────────────────────────────────────────────────│
│ 0 - 1 kg      │ RM 5.00 [Edit]     │ RM 10.00 [Edit]     │
│ 1 - 2 kg      │ RM 7.00 [Edit]     │ RM 13.00 [Edit]     │
│ 2 - 3 kg      │ RM 9.00 [Edit]     │ RM 16.00 [Edit]     │
│ 3 - 5 kg      │ RM 12.00 [Edit]    │ RM 20.00 [Edit]     │
│ 5+ kg         │ RM 15.00 [Edit]    │ RM 25.00 [Edit]     │
│                                                             │
│ [+ Add Weight Band] [Remove Band] [Validate Ranges]        │
└─────────────────────────────────────────────────────────────┘
```

#### Bulk Rate Editor

```typescript
interface BulkRateEditor {
  selection: {
    zones: string[];
    weightRanges: WeightRange[];
    ruleSet: string;
  };
  operation: {
    type: 'PERCENTAGE' | 'FLAT_AMOUNT' | 'SET_PRICE';
    value: number;
    preview: boolean;
  };
  preview: {
    affectedRules: number;
    oldValues: number[];
    newValues: number[];
    totalImpact: number;
  };
  safety: {
    confirmationRequired: boolean;
    reason: string;
    backupCreated: boolean;
  };
}
```

**Bulk Edit Modal**
```
┌─────────────────────────────────────────────────────────────┐
│ Bulk Rate Update                                [X]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Selection Criteria:                                         │
│ Zones: ☑ Peninsular ☑ East Malaysia                       │
│ Weight: ☑ 0-1kg ☑ 1-2kg ☐ 2-3kg ☐ 3-5kg ☐ 5kg+          │
│ Rule Set: [Standard Rates ▼]                               │
│                                                             │
│ Update Type:                                                │
│ ◉ Percentage Increase  ○ Flat Amount  ○ Set Price         │
│ Value: [10] %                                               │
│                                                             │
│ Preview (4 rules affected):                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Zone              Weight    Old     New     Change      │ │
│ │ Peninsular       0-1kg     RM 5    RM 5.50  +RM 0.50  │ │
│ │ Peninsular       1-2kg     RM 7    RM 7.70  +RM 0.70  │ │
│ │ East Malaysia    0-1kg     RM 10   RM 11.00 +RM 1.00  │ │
│ │ East Malaysia    1-2kg     RM 13   RM 14.30 +RM 1.30  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Reason: [Annual rate adjustment for inflation____________]  │
│                                                             │
│ ☑ Create backup before applying changes                    │
│ ☑ Send notification to team                                │
│                                                             │
│ [Cancel] [Preview Changes] [Apply Changes]                 │
└─────────────────────────────────────────────────────────────┘
```

### 4. API/CSV Fulfillment Management

#### Decision Rules Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ Fulfillment Decision Rules               Last Updated: 2h ago│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Admin Controls:                                             │
│ Mode: ◉ Automatic  ○ Force API  ○ Force CSV               │
│ Emergency Override: ○ Enabled  ◉ Disabled                 │
│                                                             │
│ API Health Thresholds:                                     │
│ Response Time Warning: [5000] ms                           │
│ Response Time Critical: [10000] ms                         │
│ Success Rate Warning: [90] %                               │
│ Success Rate Critical: [80] %                              │
│ Consecutive Failures Limit: [5]                            │
│                                                             │
│ Business Rules:                                             │
│ CSV Order Threshold: [50] orders                           │
│ Peak Hour CSV Mode: ☑ Enabled (9-11 AM, 2-4 PM)          │
│ Express Orders: ◉ Always API  ○ Follow Rules              │
│ High Value Orders (>RM1000): ◉ Prefer API  ○ Follow Rules │
│                                                             │
│ Cost Management:                                            │
│ Monthly API Budget: RM [1000]                              │
│ Cost per API Call: RM [0.50]                               │
│ Budget Warning: [80] %                                      │
│ Budget Critical: [95] %                                     │
│                                                             │
│ [Test Rules] [Save Changes] [Reset to Default]             │
└─────────────────────────────────────────────────────────────┘
```

#### API Health Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ EasyParcel API Health Monitor            🟢 HEALTHY         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Current Status ─────────────────────────────────────────┐ │
│ │ Response Time: 847ms (Good)   Success Rate: 98.2%       │ │
│ │ Last Check: 30 seconds ago    Uptime: 99.1% (24h)       │ │
│ │ Consecutive Successes: 127    Queue Depth: 0            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Today's Performance ───────────────────────────────────┐ │
│ │ API Calls: 1,247             Avg Response: 952ms        │ │
│ │ Successful: 1,223 (98.1%)    Failed: 24 (1.9%)        │ │
│ │ Cost: RM 623.50              Budget Used: 62.4%         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Response Time Trend (Last 24h) ───────────────────────┐ │
│ │     ms                                                  │ │
│ │ 3000┤                                    ▲              │ │
│ │ 2500┤                               ▲   ███             │ │
│ │ 2000┤                          ▲   ███  ███             │ │
│ │ 1500┤                     ▲   ███  ███  ███             │ │
│ │ 1000┤  ▲   ▲   ▲    ▲   ███  ███  ███  ███   ▲        │ │
│ │  500┤ ███ ███ ███  ███  ███  ███  ███  ███  ███        │ │
│ │    0└─┴───┴───┴────┴────┴────┴────┴────┴────┴───        │ │
│ │     00  04  08   12   16   20   24   04   08           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [View Detailed Logs] [Test Connection] [Configure Alerts]  │
└─────────────────────────────────────────────────────────────┘
```

#### CSV Processing Queue

```
┌─────────────────────────────────────────────────────────────┐
│ CSV Processing Queue                      3 batches pending │
├─────────────────────────────────────────────────────────────┤
│ [Process All] [Download Batch] [Archive Old] [Settings]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Batch #2024-001247 ──────────────────┬─ Priority: HIGH ┐ │
│ │ Created: 14:32 (23 min ago)           │ Orders: 47      │ │
│ │ Status: 🟡 Ready for Processing       │ Est: 12 minutes │ │
│ │ Contains: 12 Express, 35 Standard     │ [Process Now]   │ │
│ └────────────────────────────────────────┴─────────────────┘ │
│                                                             │
│ ┌─ Batch #2024-001246 ──────────────────┬─ Priority: MED ┐ │
│ │ Created: 13:15 (1h 17min ago)         │ Orders: 23      │ │
│ │ Status: 🟢 Processing                 │ Progress: 78%   │ │
│ │ ETA: 4 minutes remaining               │ [View Details]  │ │
│ └────────────────────────────────────────┴─────────────────┘ │
│                                                             │
│ ┌─ Batch #2024-001245 ──────────────────┬─ Priority: LOW ┐ │
│ │ Created: 12:45 (1h 47min ago)         │ Orders: 156     │ │
│ │ Status: ⚪ Queued                     │ Est: 45 minutes │ │
│ │ Note: Large batch, COD orders         │ [Edit Priority] │ │
│ └────────────────────────────────────────┴─────────────────┘ │
│                                                             │
│ Processing Statistics (Today):                              │
│ Processed: 8 batches  Orders: 342  Avg Time: 18 minutes   │
└─────────────────────────────────────────────────────────────┘
```

### 5. Analytics & Reporting Dashboard

#### Shipping Analytics Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Shipping Analytics - December 2024        [Export] [Print] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Revenue vs Cost Analysis ─────────────────────────────┐  │
│ │                                                         │  │
│ │  RM                                                     │  │
│ │ 8000┤ ███████████████████████████████ Revenue (RM7,892) │  │
│ │ 6000┤ ████████████████████████████                      │  │
│ │ 4000┤ ██████████████████████                            │  │
│ │ 2000┤ ██████████ Costs (RM2,134)                        │  │
│ │    0└─────────────────────────────────────────────────   │  │
│ │     Profit Margin: 72.96% (+RM5,758)                   │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Zone Performance ──────────────────────────────────────┐ │
│ │ Zone              Orders  Revenue    Avg Cost  Margin   │ │
│ │ Peninsular       1,247    RM 5,234   RM 1.89   73.2%   │ │
│ │ East Malaysia    342      RM 2,658   RM 2.43    71.8%  │ │
│ │ Other            23       RM 156     RM 3.12    68.1%   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ API vs CSV Performance ────────────────────────────────┐ │
│ │ Method  Orders  Success%  Avg Time   Cost    Efficiency │ │
│ │ API     987     98.2%     2.1s       RM 493  High       │ │
│ │ CSV     625     99.8%     18.3min    RM 31    Very High │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Weight Distribution ───────────────────────────────────┐ │
│ │ 0-1kg: ████████████████ 48.2% (769 orders)             │ │
│ │ 1-2kg: ██████████ 31.1% (497 orders)                   │ │
│ │ 2-3kg: ██████ 15.2% (243 orders)                       │ │
│ │ 3-5kg: ██ 4.1% (65 orders)                             │ │
│ │ 5kg+:  ▌ 1.4% (22 orders)                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 6. System Monitoring Interface

#### Alert Management Center

```typescript
interface AlertDashboard {
  activeAlerts: Alert[];
  alertHistory: AlertHistory[];
  alertRules: AlertRule[];
  notificationChannels: NotificationChannel[];
}

interface Alert {
  id: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'API_PERFORMANCE' | 'BUDGET_EXCEEDED' | 'CSV_BACKLOG' | 'SYSTEM_ERROR';
  message: string;
  timestamp: Date;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedTo?: string;
  actions: AlertAction[];
}
```

**Alert Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ System Alerts & Notifications          🔔 2 Active Alerts  │
├─────────────────────────────────────────────────────────────┤
│ [All] [Critical] [Warning] [Info] [Acknowledged] [Resolved] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ 🔴 CRITICAL ─────────────────────────┬─ 14:32 (23m ago)┐ │
│ │ API Budget Exceeded (95%)             │ Status: ACTIVE   │ │
│ │ Monthly API budget limit reached.     │ [Acknowledge]    │ │
│ │ Consider switching to CSV mode.       │ [Increase Budget]│ │
│ │ Assigned: Sarah (Operations Manager)  │ [Force CSV Mode] │ │
│ └───────────────────────────────────────┴──────────────────┘ │
│                                                             │
│ ┌─ 🟡 WARNING ──────────────────────────┬─ 13:45 (1h ago) ┐ │
│ │ API Response Time Degraded            │ Status: ACTIVE   │ │
│ │ Average response time: 8.2s (>5s)     │ [Acknowledge]    │ │
│ │ Monitor for potential API issues.     │ [View Details]   │ │
│ │ Auto-escalation in: 15 minutes        │ [Suppress 1h]    │ │
│ └───────────────────────────────────────┴──────────────────┘ │
│                                                             │
│ ┌─ 🟢 RESOLVED ──────────────────────────┬─ 12:15 (2h ago)┐ │
│ │ CSV Processing Backlog Cleared        │ Status: RESOLVED │ │
│ │ All pending batches processed         │ [View Details]   │ │
│ │ Resolved by: Mike (IT Manager)        │ [Archive]        │ │
│ └───────────────────────────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

### Breakpoint Strategy

```css
/* Mobile First Approach */
.admin-interface {
  /* Mobile: 320px - 768px */
  font-size: 14px;
  padding: 8px;
}

@media (min-width: 768px) {
  /* Tablet: 768px - 1024px */
  .admin-interface {
    font-size: 15px;
    padding: 12px;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 1024px+ */
  .admin-interface {
    font-size: 16px;
    padding: 16px;
  }
}
```

### Mobile Interface Adaptations

#### Mobile Navigation
```
┌─────────────────────┐
│ ☰ EcomJRM   🔔 👤   │ ← Hamburger menu
├─────────────────────┤
│ 📊 Dashboard        │
│ 🗺️ Zones           │
│ 💰 Rates           │
│ ⚙️ Fulfillment     │
│ 📈 Analytics       │
│ 🔧 Settings        │
└─────────────────────┘
```

#### Mobile Rate Matrix (Card Layout)
```
┌─────────────────────┐
│ Peninsular Malaysia │
├─────────────────────┤
│ 0-1kg    RM 5.00    │
│ 1-2kg    RM 7.00    │
│ 2-3kg    RM 9.00    │
│ 3-5kg    RM 12.00   │
│ 5kg+     RM 15.00   │
│ [Edit Zone Rates]   │
└─────────────────────┘

┌─────────────────────┐
│ East Malaysia       │
├─────────────────────┤
│ 0-1kg    RM 10.00   │
│ 1-2kg    RM 13.00   │
│ 2-3kg    RM 16.00   │
│ 3-5kg    RM 20.00   │
│ 5kg+     RM 25.00   │
│ [Edit Zone Rates]   │
└─────────────────────┘
```

## Accessibility Requirements

### WCAG 2.1 AA Compliance

#### Color and Contrast
```css
/* High contrast color scheme */
:root {
  --primary: #0066cc;
  --secondary: #6c757d;
  --success: #28a745;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #17a2b8;
  
  /* Ensure 4.5:1 contrast ratio minimum */
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
}
```

#### Keyboard Navigation
```typescript
interface KeyboardShortcuts {
  navigation: {
    'Alt + D': 'Go to Dashboard';
    'Alt + Z': 'Zone Management';
    'Alt + R': 'Rate Management';
    'Alt + F': 'Fulfillment Settings';
    'Alt + A': 'Analytics';
  };
  actions: {
    'Ctrl + S': 'Save changes';
    'Ctrl + Z': 'Undo last action';
    'Escape': 'Cancel/Close modal';
    'Enter': 'Confirm action';
    'Tab': 'Navigate to next element';
    'Shift + Tab': 'Navigate to previous element';
  };
  tables: {
    'Arrow Keys': 'Navigate cells';
    'Space': 'Toggle selection';
    'Ctrl + A': 'Select all';
    'Delete': 'Delete selected items';
  };
}
```

#### Screen Reader Support
```html
<!-- Semantic HTML structure -->
<main aria-label="Shipping Management Dashboard">
  <section aria-labelledby="zone-management-heading">
    <h2 id="zone-management-heading">Zone Management</h2>
    <table role="grid" aria-label="Shipping zones list">
      <thead>
        <tr role="row">
          <th role="columnheader" aria-sort="ascending">Zone Name</th>
          <th role="columnheader">States</th>
          <th role="columnheader">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr role="row" aria-selected="false">
          <td role="gridcell">Peninsular Malaysia</td>
          <td role="gridcell">12 states</td>
          <td role="gridcell">
            <span aria-label="Active status">●</span>
            Active
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</main>
```

## Performance Requirements

### Loading Time Standards
- **Initial Page Load**: < 3 seconds
- **Navigation Between Pages**: < 1 second
- **Data Table Loading**: < 2 seconds
- **Form Submission**: < 2 seconds
- **Chart/Analytics Rendering**: < 3 seconds

### Progressive Loading Strategy
```typescript
interface ProgressiveLoading {
  skeleton: {
    showSkeletons: boolean;
    estimatedLoadTime: number;
  };
  lazyLoading: {
    images: boolean;
    charts: boolean;
    tables: boolean;
  };
  caching: {
    staticAssets: 'aggressive';
    apiResponses: '5-minutes';
    userPreferences: 'session';
  };
}
```

### Offline Functionality
```typescript
interface OfflineCapabilities {
  readOnlyAccess: {
    viewLastLoadedData: boolean;
    cachedReports: boolean;
    offlineIndicator: boolean;
  };
  criticalActions: {
    emergencyCSVMode: boolean;
    basicRateViewing: boolean;
    alertAcknowledgment: boolean;
  };
  syncOnReconnect: {
    queueActions: boolean;
    conflictResolution: 'server-wins' | 'manual-merge';
    syncIndicator: boolean;
  };
}
```

## Security & Permissions

### Role-Based Access Control

```typescript
interface UserRoles {
  SUPER_ADMIN: {
    permissions: [
      'SYSTEM_CONFIGURATION',
      'USER_MANAGEMENT', 
      'API_CONFIGURATION',
      'DATABASE_ACCESS',
      'ALL_ANALYTICS'
    ];
    restrictions: [];
  };
  
  ADMIN: {
    permissions: [
      'ZONE_MANAGEMENT',
      'RATE_MANAGEMENT', 
      'FULFILLMENT_SETTINGS',
      'CSV_PROCESSING',
      'OPERATIONAL_ANALYTICS'
    ];
    restrictions: [
      'NO_USER_MANAGEMENT',
      'NO_SYSTEM_CONFIG'
    ];
  };
  
  OPERATOR: {
    permissions: [
      'RATE_VIEWING',
      'CSV_PROCESSING',
      'BASIC_ANALYTICS',
      'ALERT_ACKNOWLEDGMENT'
    ];
    restrictions: [
      'NO_RATE_EDITING',
      'NO_SYSTEM_SETTINGS',
      'READ_ONLY_ANALYTICS'
    ];
  };
  
  VIEWER: {
    permissions: [
      'DASHBOARD_VIEWING',
      'BASIC_ANALYTICS',
      'RATE_VIEWING'
    ];
    restrictions: [
      'READ_ONLY_ACCESS',
      'NO_SYSTEM_CHANGES'
    ];
  };
}
```

### Audit Trail Interface

```
┌─────────────────────────────────────────────────────────────┐
│ System Audit Trail                    [Export] [Filter]     │
├─────────────────────────────────────────────────────────────┤
│ Date Range: [Last 30 days ▼] User: [All ▼] Action: [All ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Timestamp          User            Action                   │
│ ─────────────────────────────────────────────────────────── │
│ 2024-12-01 14:32   Sarah (Admin)   Updated bulk rates      │
│ 2024-12-01 13:15   Mike (SuperAdmin) Modified API settings │
│ 2024-12-01 12:45   Sarah (Admin)   Processed CSV batch     │
│ 2024-12-01 11:30   Lisa (Viewer)   Viewed analytics        │
│ 2024-12-01 10:15   Sarah (Admin)   Created shipping zone   │
│                                                             │
│ [View Details] [Download Log] [Set Alert]                  │
└─────────────────────────────────────────────────────────────┘
```

This comprehensive admin interface specification ensures a user-friendly, efficient, and secure management experience for the smart shipping system, supporting all user roles while maintaining operational excellence.