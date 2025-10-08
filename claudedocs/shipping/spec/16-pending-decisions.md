## Pending Decisions

### ✅ RESOLVED: Courier Selection Strategy

**Original Problem:**
- EasyParcel API requires delivery address to return available couriers
- Admin can't pre-select specific courier without knowing destination

**Solution Adopted (Based on WooCommerce Plugin Study):**

Implement **strategy-based courier selection** with three modes:

1. **"Cheapest Courier" (Default/Recommended)**
   - System auto-selects lowest cost option
   - Customer sees one rate, no choice needed
   - Simplest checkout experience

2. **"Show All Couriers"**
   - Customer chooses from all available couriers
   - Maximum customer flexibility
   - May have different prices

3. **"Selected Couriers"**
   - Admin chooses which courier IDs to allow (via `getCourierList()` API)
   - System filters checkout options to only show admin-selected couriers
   - Balances control with flexibility

**Key Insight from WooCommerce:**
- Don't try to select specific couriers without address
- Instead, select a **selection strategy**
- Apply strategy at checkout when destination is known

**Implementation Status:** Documented in spec, ready for development

---

### 🔄 OPEN DECISIONS

**None currently** - All major decisions resolved for v1

---
