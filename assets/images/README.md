# PSDepot Image Assets - README

## Overview
This document tracks the image requirements for Performance Supply Depot LLC website.

## Required Images (Upload to `/var/www/psdepot.com/assets/images/`)

### Priority 1: Business Location Images (For Local SEO)
- **warehouse-bay-area.jpg** - Warehouse exterior or interior shot showing California location
- **team-warehouse.jpg** - Team photo in warehouse/office setting
- **pos-delivery-truck.jpg** - Delivery vehicle with branding (if available)

### Priority 2: Product Images (For Product Schema)
- **thermal-paper-rolls.jpg** - Stack of thermal paper rolls/cases
- **printer-ribbons.jpg** - Display of ink ribbons
- **pos-hardware.jpg** - POS systems, scales, cash registers

### Priority 3: Service Images
- **cabling-installation.jpg** - Network/POS cabling work
- **printer-repair.jpg** - Technician repairing printer
- **pos-installation.jpg** - POS system setup in action

## Image Specifications

### Technical Requirements
- **Format:** JPG (photographs) or WebP (preferred for web)
- **Resolution:** Minimum 1200x800px
- **File Size:** Under 500KB each (compress for web)
- **Aspect Ratio:** 3:2 or 16:9 for consistency

### Geo Tagging (IMPORTANT for Local SEO)
When capturing/uploading images, ensure EXIF data includes:
- **Latitude:** 37.7749 (San Francisco Bay Area)
- **Longitude:** -122.4194
- **City:** San Francisco
- **State:** California
- **Country:** USA

Tools to add geo tags:
- **Desktop:** ExifTool, GeoImgr
- **Mobile:** Open Camera (Android), GeoTag Photos (iOS)
- **Online:** geoimgr.com

## Current Status
- [ ] warehouse-bay-area.jpg
- [ ] team-warehouse.jpg  
- [ ] pos-delivery-truck.jpg
- [ ] thermal-paper-rolls.jpg
- [ ] printer-ribbons.jpg
- [ ] pos-hardware.jpg

## Geo Tagging Applied

### HTML Meta Tags (Already in `/var/www/psdepot.com/index.html`)
```html
<meta name="geo.region" content="US-CA">
<meta name="geo.placename" content="San Francisco Bay Area, California">
<meta name="geo.position" content="37.7749;-122.4194">
<meta name="ICBM" content="37.7749, -122.4194">
```

### Schema.org Areas Served (Already Configured)
- San Francisco
- Oakland  
- San Jose
- Los Angeles
- San Diego
- Northern California
- Southern California

## Testing
Verify geo tags are working:
1. Use Google's Rich Results Test: https://search.google.com/test/rich-results
2. Check schema markup validation
3. Submit updated sitemap to Google Search Console

## Notes
- Images referenced in LocalBusiness schema will appear in Google Business results
- Product images will enhance product listings in search
- Gallery section uses CSS gradients as placeholders until photos are uploaded
- Replace placeholder divs with actual `<img>` tags once images are ready

Last Updated: 2026-07-13
