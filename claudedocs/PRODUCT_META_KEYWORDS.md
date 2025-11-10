# Product Meta Keywords - Phase 2 SEO Optimization

**Purpose:** Bahasa Malaysia SEO keywords for 10 priority products
**Status:** Ready for Implementation
**Date:** November 10, 2025

---

## 📌 Implementation Instructions

### How to Add Keywords to Products

**Option 1: Via Admin Panel (Recommended)**
1. Go to Admin → Products → Edit Product
2. Find the "Meta Keywords" field
3. Copy the keywords array from below
4. Paste as JSON array: `["keyword1", "keyword2", "keyword3"]`
5. Save the product

**Option 2: Via Database (Direct)**
```sql
UPDATE products
SET "metaKeywords" = '["keyword1", "keyword2", "keyword3"]'::jsonb
WHERE slug = 'product-slug';
```

---

## 🎯 Priority Product Keywords

### 1. Mega Ratu
**Category:** Jamu Kesihatan Wanita
**Primary Focus:** Menopause, hormonal balance, women's health

**Keywords Array:**
```json
[
  "Mega Ratu",
  "Mega Ratu JRM",
  "Mega Ratu JRM HOLISTIK",
  "jamu untuk wanita",
  "jamu kesihatan wanita",
  "jamu untuk menopause",
  "jamu mengimbangi hormon",
  "jamu hormon wanita",
  "jamu lulus KKM",
  "jamu halal Malaysia",
  "jamu untuk perimenopause",
  "jamu kesihatan dalaman wanita"
]
```

**Rationale:**
- Brand variants (Mega Ratu, Mega Ratu JRM, Mega Ratu JRM HOLISTIK)
- Health conditions (menopause, perimenopause, hormon)
- Trust signals (lulus KKM, halal)
- Target audience (wanita, kesihatan wanita)

---

### 2. Royal V
**Category:** Jamu Kesihatan Wanita
**Primary Focus:** Intimate health, vaginal health, women's wellness

**Keywords Array:**
```json
[
  "Royal V",
  "Royal V JRM",
  "Royal V JRM HOLISTIK",
  "jamu untuk wanita",
  "jamu kesihatan intim",
  "jamu kesihatan kewanitaan",
  "jamu untuk V",
  "jamu kesihatan dalaman",
  "jamu lulus KKM",
  "jamu halal Malaysia",
  "jamu untuk vagina",
  "jamu kewanitaan terbaik"
]
```

**Rationale:**
- Product name variants
- Intimate health focus (kesihatan intim, kewanitaan)
- Specific keyword "V" for vaginal health
- Trust and certification keywords

---

### 3. Mustanir
**Category:** Jamu Kesihatan Lelaki
**Primary Focus:** Men's health, vitality, stamina

**Keywords Array:**
```json
[
  "Mustanir",
  "Mustanir JRM",
  "Mustanir JRM HOLISTIK",
  "jamu untuk lelaki",
  "jamu kesihatan lelaki",
  "jamu tenaga lelaki",
  "jamu stamina lelaki",
  "jamu vitaliti lelaki",
  "jamu lulus KKM",
  "jamu halal Malaysia",
  "jamu kuat lelaki",
  "jamu untuk pria Malaysia"
]
```

**Rationale:**
- Men's health market (lelaki, pria)
- Performance keywords (tenaga, stamina, vitaliti, kuat)
- Trust signals

---

### 4. Marjane Oil
**Category:** Aromaterapi & Minyak Herba
**Primary Focus:** Herbal oil, aromatherapy, wellness

**Keywords Array:**
```json
[
  "Marjane Oil",
  "Marjane Oil JRM",
  "minyak Marjane",
  "minyak herba",
  "minyak aromaterapi",
  "minyak urut tradisional",
  "minyak pati herba",
  "minyak kesihatan",
  "minyak lulus KKM",
  "aromaterapi Malaysia",
  "minyak urut Malaysia",
  "minyak herba tulen"
]
```

**Rationale:**
- Product name + "minyak" variations
- Aromatherapy and massage focus
- Traditional herbal oil positioning

---

### 5. Kopi Ratu
**Category:** Kopi Kesihatan
**Primary Focus:** Health coffee, women's wellness coffee, functional beverage

**Keywords Array:**
```json
[
  "Kopi Ratu",
  "Kopi Ratu JRM",
  "kopi kesihatan",
  "kopi untuk wanita",
  "kopi jamu",
  "kopi herba",
  "kopi kesihatan wanita",
  "kopi tradisional Malaysia",
  "kopi halal",
  "kopi dengan jamu",
  "functional coffee Malaysia",
  "kopi sihat Malaysia"
]
```

**Rationale:**
- Coffee + health positioning
- Women's wellness coffee niche
- Functional beverage keywords
- Traditional meets modern (kopi jamu, kopi herba)

---

### 6. Bio Miracle Action Cream
**Category:** Penjagaan Kulit
**Primary Focus:** Skincare, anti-aging, beauty

**Keywords Array:**
```json
[
  "Bio Miracle Action Cream",
  "Bio Miracle JRM",
  "krim penjagaan kulit",
  "krim anti-aging",
  "krim kecantikan",
  "krim wajah herba",
  "krim kesihatan kulit",
  "skincare Malaysia",
  "krim halal Malaysia",
  "krim muka terbaik",
  "krim herba untuk kulit",
  "produk kecantikan JRM"
]
```

**Rationale:**
- Skincare and beauty focus
- Anti-aging positioning
- Herbal skincare angle
- Beauty product keywords

---

### 7. Body Butter
**Category:** Penjagaan Badan
**Primary Focus:** Body care, moisturizer, natural skincare

**Keywords Array:**
```json
[
  "Body Butter",
  "Body Butter JRM",
  "pelembap badan",
  "body butter Malaysia",
  "pelembap badan semula jadi",
  "body lotion herba",
  "penjagaan kulit badan",
  "moisturizer badan",
  "body butter halal",
  "pelembap badan terbaik",
  "body care Malaysia",
  "produk penjagaan badan"
]
```

**Rationale:**
- Body care focus
- Natural moisturizer positioning
- Herbal body care keywords

---

### 8. Body Mist
**Category:** Pewangi & Aromaterapi
**Primary Focus:** Body fragrance, aromatherapy, wellness

**Keywords Array:**
```json
[
  "Body Mist",
  "Body Mist JRM",
  "body mist Malaysia",
  "pewangi badan",
  "body spray herba",
  "aromaterapi badan",
  "body fragrance Malaysia",
  "perfume mist halal",
  "body mist semula jadi",
  "pewangi badan natural",
  "body mist terbaik",
  "fragrance spray Malaysia"
]
```

**Rationale:**
- Fragrance and body mist focus
- Aromatherapy positioning
- Natural fragrance keywords

---

### 9. Oil of Javanica
**Category:** Aromaterapi & Minyak Herba
**Primary Focus:** Essential oil, aromatherapy, therapeutic oil

**Keywords Array:**
```json
[
  "Oil of Javanica",
  "Javanica Oil JRM",
  "minyak Javanica",
  "minyak pati herba",
  "essential oil Malaysia",
  "minyak aromaterapi",
  "minyak kesihatan",
  "therapeutic oil Malaysia",
  "minyak herba tulen",
  "aromaterapi Malaysia",
  "minyak urut herba",
  "essential oil halal"
]
```

**Rationale:**
- Essential oil positioning
- Therapeutic and aromatherapy focus
- Premium herbal oil keywords

---

### 10. Akasia Honey Cleanser
**Category:** Penjagaan Kulit
**Primary Focus:** Face cleanser, natural skincare, honey-based

**Keywords Array:**
```json
[
  "Akasia Honey Cleanser",
  "Honey Cleanser JRM",
  "pembersih muka",
  "cleanser madu",
  "pembersih wajah herba",
  "honey facial cleanser",
  "pembersih muka semula jadi",
  "facial wash Malaysia",
  "cleanser halal",
  "pembersih muka terbaik",
  "honey skincare Malaysia",
  "pembersih wajah madu akasia"
]
```

**Rationale:**
- Face cleanser focus
- Honey-based unique positioning
- Natural skincare keywords

---

## 📊 Keyword Strategy Summary

### Keyword Distribution Pattern

Each product has **12 keywords** following this structure:

1. **Brand Keywords (3):**
   - Product name
   - Product name + JRM
   - Product name + JRM HOLISTIK

2. **Category Keywords (3-4):**
   - Product category in Bahasa Malaysia
   - Product type variations
   - Usage context

3. **Benefit Keywords (2-3):**
   - Primary benefit
   - Secondary benefit
   - Target audience

4. **Trust Signal Keywords (2):**
   - "lulus KKM" (if applicable)
   - "halal Malaysia"

5. **Long-tail Keywords (2):**
   - Specific use cases
   - Niche positioning phrases

---

## 🎯 SEO Optimization Guidelines

### Keyword Density
- **Target:** 1-2% keyword density in product description
- **Natural Integration:** Keywords must flow naturally in content
- **Avoid Keyword Stuffing:** Don't force keywords unnaturally

### Keyword Placement Priority
1. **Meta Title:** Include primary keyword (Product Name + JRM HOLISTIK)
2. **Meta Description:** Include 2-3 main keywords naturally
3. **H1 Heading:** Product name with primary category
4. **First Paragraph:** Primary keyword within first 50 words
5. **Benefit Headers:** Integrate keywords in section titles
6. **Image Alt Text:** Use keywords in image descriptions

### Long-tail vs Short-tail Balance
- **Short-tail (1-2 words):** 30% (e.g., "jamu wanita", "kopi kesihatan")
- **Long-tail (3-5 words):** 70% (e.g., "jamu kesihatan wanita terbaik")

---

## ✅ Implementation Checklist

### For Each Product:
- [ ] Copy keywords array from this document
- [ ] Update product via admin panel or database
- [ ] Verify keywords appear in meta tags
- [ ] Check keyword integration in product description
- [ ] Ensure keywords align with content sections
- [ ] Test product page meta tags in browser dev tools

### Post-Implementation:
- [ ] Run `npm run build` to verify no errors
- [ ] Test all 10 product pages load correctly
- [ ] Verify meta tags in page source
- [ ] Submit updated URLs to Google Search Console

---

## 📈 Expected Results

### Week 1-2 (Post-Implementation)
- Google indexes updated product pages with new keywords
- Product pages appear in search for brand + product keywords

### Week 3-4
- **Brand + Product Keywords:**
  - "Mega Ratu JRM" → Top 3
  - "Royal V JRM" → Top 5
  - "Kopi Ratu" → Top 10

### Week 5-8
- **Category Keywords:**
  - "jamu untuk menopause" → Top 10
  - "jamu kesihatan wanita" → Top 15
  - "kopi kesihatan wanita" → Top 20

### Week 9-12
- **Long-tail Keywords:**
  - 10-20 product-specific long-tail keywords ranking
  - Product pages receiving 50-100 organic visits per week
  - 15-25% improvement in conversion rate

---

## 🔄 Maintenance & Updates

### Monthly Review:
- Analyze keyword performance in Google Search Console
- Identify new keyword opportunities
- Add trending keywords based on search data
- Remove underperforming keywords

### Quarterly Updates:
- Refresh keywords based on seasonal trends
- Add new product-specific keywords from customer searches
- Optimize for emerging jamu-related search terms

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Next Review:** December 10, 2025
**Status:** Ready for Implementation
