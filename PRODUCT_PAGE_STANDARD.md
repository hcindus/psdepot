# Product Page Standard v1.0
## Performance Supply Depot LLC

---

## Summary

Created standardized product pages for OrionStar Lucki AI Delivery Robot with:

### Files Created

| File | Purpose | Language |
|------|---------|----------|
| `/var/www/psdepot.com/products/orionstar-lucki.html` | Full product page | English |
| `/var/www/psdepot.com/robotics-automation.html` | Category landing page | English |
| `/var/www/psdepot.com/robotics-automation-chinese.html` | Category landing | 中文 |
| `/var/www/psdepot.com/robotics-automation-spanish.html` | Category landing | Español |
| `/var/www/psdepot.com/robotics-san-francisco.html` | Geotagged city page | English |
| `/var/www/psdepot.com/products/lucki-tile.html` | Product tile component | Multi |
| `PRODUCT_PAGE_STANDARD.md` | This documentation | EN |

---

## Standardized Design System

### Colors (AGI Brand)
- **Primary**: `#0A1A2F` (Deep Tech Blue)
- **Accent**: `#FF7A00` (Performance Orange)
- **Cyan**: `#00E0FF` (Electric - highlights)
- **Success**: `#48bb78` (In Stock indicator)

### Header Standard
```
PerformanceSupplyDepot (logo)
├── Deep blue background (#0A1A2F)
├── "Supply" in accent orange
├── Patriotic blinking phone
├── Cart button in accent orange
└── Sticky on scroll
```

### Product Page Structure
```
1. Header (sticky)
2. Breadcrumb navigation
3. Product Container (2-column grid)
   ├── Image section (sticky, gallery)
   └── Info section
       ├── SKU badge
       ├── Title
       ├── Subtitle tags
       ├── Price section
       │   ├── Price
       │   ├── Stock indicator
       │   ├── Quantity selector
       │   └── CTA buttons
       ├── Features list
       ├── SERVICES SECTION ⭐ NEW
       │   ├── White Glove Delivery
       │   ├── Space Mapping
       │   ├── Staff Training
       │   ├── 30-Day Support
       │   └── Complete Setup Package ($599)
       └── Tabs (Description/Specs/Applications)
4. Cross-sell section
5. Footer
```

### Required Elements
- Schema.org Product JSON-LD
- Open Graph tags
- Geo meta tags
- hreflang for multilingual
- Canonical URL
- Lazy loading images
- Mobile responsive

---

## Services Package

### Included with Purchase (Free)
- ✅ Shipping (Free nationwide)
- ✅ Phone/Email Support
- ✅ Documentation

### Professional Setup: $599 ⭐ RECOMMENDED
- 📦 **White Glove Delivery** - Unboxing, assembly, placement
- 🗺️ **Space Mapping** - LiDAR configuration for your floor plan
- 👥 **Staff Training** - 2-hour hands-on session
- 🛠️ **90-Day Support** - Extended support period

---

## Product Tile Component

Standardized 320px tile with:
- 4:3 image ratio
- Stock badge (green/orange)
- Category tag
- 2-line title with ellipsis
- Price in accent color
- Dual CTA buttons (View + Quote)

---

## Multilingual Support

### Implemented Languages
- **English**: Primary
- **Chinese (Simplified)**: Major SF, LA, NYC, Seattle markets
- **Spanish**: National coverage

### Geotagged Cities

**Asian Communities:**
- San Francisco (Chinatown, Sunset, Richmond)
- Los Angeles (San Gabriel Valley)
- San Jose
- New York (Flushing, Chinatown)
- Seattle

**Hispanic Communities:**
- Miami
- Los Angeles
- Houston
- New York
- Chicago
- Phoenix
- Dallas
- San Antonio
- San Diego
- El Paso

---

## Technical Notes

### Stock Tracking
- Real-time inventory: 14 units
- Badge updates with stock levels
- Low stock warning at < 5 units

### Pricing
- Base: $3,330.00
- Calculation: $2,000 / 0.6
- Free shipping
- Net 30 for qualified businesses
- Setup Package: $599

### Images Needed
Placeholders currently used (🤖 emoji). Replace with:
- `/assets/images/products/lucki-hero.jpg`
- `/assets/images/products/lucki-side.jpg`
- `/assets/images/products/lucki-trays.jpg`
- `/assets/images/products/lucki-restaurant.jpg`

---

## Next Steps

1. Upload actual Lucki product images
2. Create additional geotagged city pages:
   - Los Angeles
   - New York
   - Miami
   - Chicago
3. Add Chinese and Spanish versions for each city
4. Update sitemap.xml with new URLs
5. Submit to Google Search Console

---

*Created: 2026-07-16*
*Standard Version: 1.1*