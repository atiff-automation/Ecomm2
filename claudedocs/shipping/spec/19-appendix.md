## Success Criteria

### Customer Experience
- ✅ Shipping cost visible before payment
- ✅ Clear messaging if shipping unavailable
- ✅ Tracking information accessible
- ✅ Email notifications received
- ✅ Smooth checkout process (< 3 clicks)

### Admin Experience
- ✅ Settings configuration < 5 minutes
- ✅ Order fulfillment < 1 minute per order
- ✅ Clear error messages with retry options
- ✅ Tracking updates visible in admin panel
- ✅ No manual intervention needed for tracking

### Technical
- ✅ Total code < 1,500 lines
- ✅ API response time < 3 seconds
- ✅ Railway cron job runs reliably
- ✅ No duplicate shipments created
- ✅ Proper error handling throughout

### Business
- ✅ 100% of eligible orders can be fulfilled
- ✅ Free shipping threshold working correctly
- ✅ Shipping costs accurate (no losses)
- ✅ Customer satisfaction with delivery times
- ✅ System scales to 100+ orders/day

---

## Appendix

### A. Malaysian State Codes

```
JOH = Johor
KDH = Kedah
KTN = Kelantan
MLK = Melaka
NSN = Negeri Sembilan
PHG = Pahang
PRK = Perak
PLS = Perlis
PNG = Pulau Pinang
SEL = Selangor
TRG = Terengganu
SBH = Sabah
SWK = Sarawak
KUL = Kuala Lumpur
LBN = Labuan
PJY = Putrajaya
```

### B. Phone Number Validation

**Format:** `+60XXXXXXXXX`

**Regex:** `^\\+60[0-9]{8,10}$`

**Examples:**
- ✅ +60123456789 (mobile)
- ✅ +60323456789 (landline)
- ❌ 0123456789 (missing +60)
- ❌ +60-12-345-6789 (has dashes)

### C. Postal Code Validation

**Format:** 5 digits

**Regex:** `^\\d{5}$`

**Examples:**
- ✅ 50000
- ✅ 88000
- ❌ 5000 (only 4 digits)
- ❌ 50000-123 (extra characters)

### D. EasyParcel API Reference

**Base URLs:**
- Sandbox: `https://sandbox.easyparcel.com/api/v1`
- Production: `https://api.easyparcel.com/v1`

**Authentication:**
- Header: `Authorization: Bearer {API_KEY}`

**Key Endpoints:**
- `POST /rates` - Get shipping rates
- `POST /shipments` - Create shipment
- `GET /tracking/{number}` - Get tracking info

**Reference:** Old documentation archived in `claudedocs/archive/old-shipping-docs/`

---

## Document Control

**Version:** 1.0
**Created:** 2025-10-07
**Last Updated:** 2025-10-07
**Status:** Final - Ready for Implementation
**Approved By:** Product Owner

**Related Documents:**
- `SHIPPING_REMOVAL_PLAN.md` - Systematic removal of old system
- `claudedocs/archive/old-shipping-docs/` - Reference documentation

**Pending:**
- Courier selection strategy research and decision

**Next Steps:**
1. Review and approve this specification
2. Execute removal plan from SHIPPING_REMOVAL_PLAN.md
3. Begin implementation following Day 1-5 timeline
4. Research courier selection strategy during development
5. Launch and monitor real-world usage
