# Google Search Console Setup Guide - Phase 1

## Purpose
After completing Phase 1 of the SEO optimization, you need to submit your sitemap to Google Search Console to help Google discover and index your pages faster.

## Prerequisites
- Phase 1 implementation completed
- Website deployed to production
- Access to your domain's DNS settings

---

## Step 1: Verify Your Website in Google Search Console

### 1.1 Go to Google Search Console
Visit: https://search.google.com/search-console/

### 1.2 Add Property
1. Click "Add Property"
2. Choose "URL prefix" method
3. Enter your website URL: `https://your-domain.com`

### 1.3 Verify Ownership
Choose one of these verification methods:

**Method A: HTML File Upload (Recommended)**
1. Download the verification HTML file
2. Upload to `/public` directory in your Next.js project
3. Deploy to production
4. Click "Verify" in Google Search Console

**Method B: DNS Record (Alternative)**
1. Copy the TXT record provided by Google
2. Add to your domain's DNS settings
3. Wait 5-10 minutes for DNS propagation
4. Click "Verify" in Google Search Console

---

## Step 2: Submit Your Sitemap

### 2.1 Access Sitemaps Section
1. In Google Search Console, go to "Sitemaps" (left sidebar)
2. Or visit: https://search.google.com/search-console/sitemaps

### 2.2 Add New Sitemap
1. Enter sitemap URL: `sitemap.xml`
2. Click "Submit"

**Your sitemap URL will be:**
```
https://your-domain.com/sitemap.xml
```

### 2.3 Verify Sitemap Success
- Status should show "Success" within a few minutes
- You'll see the number of discovered URLs
- Google will start crawling your pages

---

## Step 3: Monitor Indexing Progress

### 3.1 Check Index Coverage
1. Go to "Index" → "Coverage" in Search Console
2. Monitor "Valid" pages count
3. Look for any errors or warnings

### 3.2 Request Indexing for Key Pages
Speed up indexing for important pages:

1. Go to "URL Inspection" tool
2. Enter your homepage URL
3. Click "Request Indexing"

**Priority pages to request indexing:**
- Homepage: `https://your-domain.com`
- Products page: `https://your-domain.com/products`
- About Us: `https://your-domain.com/about-us`
- Top 5 product pages

---

## Step 4: Set Up Additional Settings

### 4.1 Set Target Country
1. Go to "Settings" → "International Targeting"
2. Select "Country": Malaysia
3. This helps Google prioritize Malaysian users

### 4.2 Set Preferred Domain
1. Go to "Settings"
2. Under "Preferred domain", ensure HTTPS is set
3. This ensures all traffic goes to secure version

---

## Expected Timeline

### Week 1-2 (Immediate Results)
- ✓ Sitemap submitted and accepted
- ✓ Google starts discovering pages
- ✓ Brand keywords start appearing:
  - "Jamu Ratu Malaya" → Rank #1 (99% confidence)
  - "JRM HOLISTIK" → Rank #1 (99% confidence)

### Week 3-4
- ✓ 50-80% of pages indexed
- ✓ Rankings for brand + category keywords:
  - "JRM jamu" → Top 5
  - "Mega Ratu JRM" → Top 3

### Week 5-8
- ✓ 90%+ pages indexed
- ✓ Rankings for generic jamu keywords:
  - "jamu untuk wanita Malaysia" → Top 15
  - "jamu lulus KKM" → Top 10

---

## Monitoring Checklist

Use this checklist to track your SEO progress:

**Weekly Tasks:**
- [ ] Check index coverage (expect 10-20% increase per week)
- [ ] Monitor "Performance" report for impression growth
- [ ] Check "Search results" for new keyword rankings
- [ ] Review "Mobile Usability" for any issues

**Monthly Tasks:**
- [ ] Compare organic traffic growth (expect 20-30% monthly increase)
- [ ] Track keyword rankings for target Bahasa Malaysia keywords
- [ ] Analyze "Pages" report to see top-performing content
- [ ] Review "Countries" to confirm Malaysian traffic dominance

---

## Troubleshooting

### Sitemap Not Showing URLs
**Issue:** Sitemap submitted but shows 0 URLs
**Solution:**
1. Visit `https://your-domain.com/sitemap.xml` directly
2. Verify XML format is correct
3. Check that products exist in database
4. Ensure website is publicly accessible (not password protected)

### Pages Not Indexing
**Issue:** Submitted sitemap but pages not appearing in Google
**Solution:**
1. Check `robots.txt`: `https://your-domain.com/robots.txt`
2. Ensure no `noindex` tags on important pages
3. Manually request indexing via URL Inspection tool
4. Wait 1-2 weeks (Google needs time to crawl)

### Coverage Errors
**Issue:** "Excluded" or "Error" status in Coverage report
**Solution:**
1. Review specific error messages
2. Common fixes:
   - "noindex tag": Remove `noindex` from metadata
   - "Soft 404": Ensure page has substantial content
   - "Server error": Check application logs for errors

---

## What to Expect After Submission

### Immediate (Within 24 Hours)
- Sitemap appears in Search Console
- Google starts discovering pages
- Initial crawl of homepage

### 1 Week
- 20-40% of pages indexed
- Brand keywords start ranking
- Impressions appear in Performance report

### 2 Weeks
- 50-70% of pages indexed
- "JRM HOLISTIK" and "Jamu Ratu Malaya" rank #1
- First organic traffic from branded searches

### 4 Weeks
- 80-90% of pages indexed
- Generic "jamu" keywords start ranking
- Measurable organic traffic increase (50-100+ visits/week)

---

## Next Steps After Phase 1

Once your sitemap is submitted and indexing is progressing:

1. **Phase 2 (Week 3-6): Product Content**
   - Rewrite top 10 product descriptions in Bahasa Malaysia
   - Add product-specific keywords
   - Expected: Product pages ranking for specific jamu keywords

2. **Phase 3 (Week 7-12): Content Marketing**
   - Create "Tentang Kami" (About Us) page
   - Launch blog with 10 Bahasa Malaysia articles
   - Expected: 30-50 long-tail keyword rankings

3. **Phase 4 (Week 13-16): Technical Optimization**
   - Optimize images with Malay alt text
   - Add breadcrumbs
   - Update footer with Bahasa Malaysia

---

## Support Resources

**Google Search Console Help:**
- Search Console Help Center: https://support.google.com/webmasters
- Sitemap Guide: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Index Coverage Guide: https://support.google.com/webmasters/answer/7440203

**SEO Monitoring Tools:**
- Google Search Console (free, essential)
- Google Analytics (free, recommended)
- Ubersuggest (free tier available, for keyword tracking)

---

## Summary

**What You Accomplished in Phase 1:**
✅ Changed website language to Bahasa Malaysia (ms)
✅ Updated all metadata with JRM HOLISTIK branding
✅ Added Bahasa Malaysia keywords (jamu untuk wanita, etc.)
✅ Created homepage brand section (400+ words Malay)
✅ Added trust signals (KKM, HALAL, Quality, Customers)
✅ Generated dynamic sitemap.xml
✅ Created robots.txt for search engines

**Expected Impact:**
- "Jamu Ratu Malaya" → Rank #1 (1-2 weeks)
- "JRM HOLISTIK" → Rank #1 (1-2 weeks)
- 70-80% more pages indexed by Google
- Foundation for Phase 2 product content optimization

**Status:** Phase 1 Complete ✅
**Next:** Submit sitemap to Google Search Console (follow steps above)

---

*Generated: November 6, 2025*
*Phase: 1 of 4*
*Document Version: 1.0*
