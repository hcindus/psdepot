# PSDepot.com SEO Gap Analysis
**Report Date:** July 13, 2026
**Current Score:** 49/100 (Digital Guider)
**Target Score:** 70+

---

## ✅ COMPLETED (Recent Work)

| Category | Status | Notes |
|----------|--------|-------|
| FAQ Schema | ✅ Done | 18 questions with structured data |
| Geo Tagging | ✅ Done | Meta tags + LocalBusiness schema |
| Keyword Integration | ✅ Done | All Liz's keywords in conversational FAQ |
| Service Cards | ✅ Done | 4-column grid, mobile responsive |
| Gallery Section | ✅ Done | 4 tiles with CA locations |
| Clarion Content | ✅ Done | Phenol-free certified recyclable added |

---

## 🔴 CRITICAL GAPS (High Impact)

### 1. IMAGES (Highest Priority)
**Status:** Missing across entire site
**Impact:** HIGH

**Missing:**
- [ ] Product photos (thermal paper rolls, ribbons, hardware)
- [ ] Team/warehouse photos
- [ ] Service photos (installations, repairs)
- [ ] Delivery/location photos

**Action Required:**
1. Upload to `/var/www/psdepot.com/assets/images/`
2. Add EXIF geo tags (37.7749, -122.4194) before upload
3. Add descriptive alt text
4. Convert placeholders to `<img>` tags

**Files to Create:**
```
assets/images/
├── thermal-paper-rolls.jpg (hero product)
├── printer-ribbons.jpg (Epson, Star)
├── pos-hardware.jpg (cash registers, scales)
├── warehouse-bay-area.jpg (with geo tags)
├── team-photo.jpg (with geo tags)
├── delivery-truck.jpg (with geo tags)
├── service-installation.jpg
└── service-repair.jpg
```

---

### 2. PAGE SPEED (Performance)
**Status:** Needs optimization
**Impact:** HIGH

**Issues:**
- Inline CSS (~600 lines in HTML) — blocks rendering
- No image optimization (lazy loading, WebP format)
- No resource preloading
- Large HTML file size (~100KB+)

**Recommended Fixes:**
```html
<!-- Add to <head> -->
<link rel="preload" href="/assets/css/main.css" as="style">
<link rel="preconnect" href="https://fonts.googleapis.com">

<!-- For images -->
<img src="image.webp" loading="lazy" alt="...">
```

**Actions:**
1. Extract CSS to external file: `/assets/css/main.css`
2. Add lazy loading to images
3. Compress images when uploaded (TinyPNG, Squoosh)
4. Enable Gzip/Brotli compression in Nginx
5. Add caching headers

---

### 3. CONTENT PAGES (Content Depth)
**Status:** Single page site
**Impact:** HIGH

**Problem:** Only homepage exists. Limited internal linking, shallow content.

**Pages to Create:**
| Page | Purpose | Keywords |
|------|---------|----------|
| `/products/thermal-paper.html` | Product category | thermal paper rolls California |
| `/products/printer-ribbons.html` | Product category | Epson printer ribbons, Star ribbons |
| `/products/pos-hardware.html` | Product category | cash registers, POS terminals |
| `/services/installation.html` | Service page | POS installation California |
| `/services/repair.html` | Service page | printer repair near me |
| `/blog/` | Content marketing | How-to guides, industry news |
| `/about.html` | Company info | About Performance Supply Depot |
| `/contact.html` | Contact page | already exists, link properly |

---

### 4. PRODUCT SCHEMA
**Status:** Partial
**Impact:** MEDIUM

**Current:** Basic Product schema in LocalBusiness > OfferCatalog

**Missing:**
- Individual Product pages with full schema
- AggregateRating (reviews)
- PriceCurrency
- Availability
- Brand
- SKU

**Example Fix:**
```json
{
  "@type": "Product",
  "name": "Phenol Free Thermal Paper 3 1/8\" x 230'",
  "image": "https://psdepot.com/assets/images/thermal-paper-rolls.jpg",
  "description": "BPA-free thermal receipt paper, 50 rolls per case",
  "brand": "Clarion by Domtar",
  "sku": "54-230",
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2026-12-31"
  }
}
```

---

### 5. ACCESSIBILITY
**Status:** Needs review
**Impact:** MEDIUM

**Potential Issues:**
- [ ] Color contrast ratios (check with WebAIM)
- [ ] Focus indicators on buttons
- [ ] ARIA labels on interactive elements
- [ ] Alt text on images (when added)
- [ ] Skip navigation link
- [ ] Form labels (contact form)

**Quick Wins:**
```css
/* Add focus styles */
button:focus, a:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
```

---

### 6. SOCIAL PROFILES
**Status:** Minimal
**Impact:** MEDIUM

**Current:** LinkedIn mentioned in schema

**Missing:**
- [ ] LinkedIn page link in footer
- [ ] Facebook Business page
- [ ] Twitter/X profile
- [ ] YouTube channel (product demos?)

**Action:** Add social links to footer with icons

---

### 7. SECURITY HEADERS
**Status:** Basic HTTPS only
**Impact:** MEDIUM

**Missing Headers:**
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- Referrer-Policy

**Nginx Config Addition:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 8. INTERNAL LINKING
**Status:** Weak
**Impact:** MEDIUM

**Problem:** Single page = no internal links between content

**Solution:** Create content pages (see #3) with breadcrumbs:
```html
<nav aria-label="breadcrumb">
  <a href="/">Home</a> > 
  <a href="/products/">Products</a> > 
  <span>Thermal Paper</span>
</nav>
```

---

### 9. SITEMAP
**Status:** Exists but basic
**Impact:** LOW-MEDIUM

**Current:** `/sitemap.xml` — basic homepage only

**Needs:**
- Update with new pages when created
- Submit to Google Search Console
- Add lastmod dates
- Include image sitemap

---

### 10. MOBILE OPTIMIZATION
**Status:** Responsive but needs review
**Impact:** MEDIUM

**Check:**
- [ ] Tap targets > 48px
- [ ] Font sizes > 16px (prevents zoom)
- [ ] Viewport meta tag (✅ exists)
- [ ] No horizontal scroll
- [ ] Button spacing adequate

---

## 📋 PRIORITY ACTION PLAN

### Phase 1: Critical (Week 1)
1. ⬜ Upload 6-8 geo-tagged images
2. ⬜ Convert placeholders to `<img>` tags with alt text
3. ⬜ Test page speed (PageSpeed Insights)

### Phase 2: High Impact (Week 2)
4. ⬜ Create `/products/thermal-paper.html` landing page
5. ⬜ Create `/services/installation.html` landing page
6. ⬜ Add Product schema to individual products
7. ⬜ Add security headers in Nginx

### Phase 3: Content Growth (Week 3-4)
8. ⬜ Create blog with first post: "How to Choose Receipt Paper for Your Business"
9. ⬜ Create `/about.html` with company story
10. ⬜ Build internal linking between pages
11. ⬜ Submit updated sitemap to Google Search Console

---

## 📊 EXPECTED IMPROVEMENTS

| Fix | Expected Score Impact |
|-----|----------------------|
| Images + alt text | +10-15 points |
| Page speed optimization | +8-12 points |
| Content pages (3+) | +10-15 points |
| Product schema | +3-5 points |
| Security headers | +3-5 points |
| Social profiles | +2-3 points |
| **TOTAL POTENTIAL** | **~70-85 points** |

**Projected Final Score:** 70-85/100 (from current 49)

---

## 🔧 IMMEDIATE NEXT STEPS

**For Liz (Content):**
1. Source 6-8 stock photos or take originals
2. Geo-tag images before upload
3. Write product descriptions for thermal paper page

**For Miles (Technical):**
1. Extract CSS to external file
2. Create product page template
3. Add security headers to Nginx
4. Set up lazy loading

---

*Document Created: July 13, 2026*
*Next Review: After images uploaded*
