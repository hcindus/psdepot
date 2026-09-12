# PSDEPOT.COM — Product Redirect Map (DRAFT)

**Prepared by:** Miles · 2026-09-12
**Source:** nginx 404 access logs (access.log + access.log.1)
**Goal:** Recover the "57 not-found (404)" pages flagged in Search Console by 301-redirecting dead product/static URLs to their correct current targets.

Confidence tiers: **T1 = implement now** · **T2 = best guess, confirm with Captain** · **T3 = needs catalog knowledge.**

---

## TIER 1 — High confidence (safe to implement immediately)

| # | Old URL (404) | → Target (200) | Reason |
|---|---|---|---|
| 1 | `/products.html` | `/products/` | products/index.html exists (29KB) |
| 2 | `/contact` | `/contact.html` | contact.html exists |
| 3 | `/privacy` | `/privacy.html` | privacy.html exists |
| 4 | `/categories/cash-drawers` | `/categories/` | generic slug → category index (4 drawer subcats exist) |
| 5 | `/categories/pos-scales/null` | `/categories/pos-scales/` | bad `null` link suffix |
| 6 | `/products/printer-ribbons/` | `/categories/printer-ribbons/` | ribbons moved to category |
| 7 | `/products/carbonless-paper/` | `/products/CC-235-carbonless-paper.html` | CC-235 carbonless exists |
| 8 | `/robotics-san-francisco-spanish.html` | `/robotics-san-francisco.html` | lang variant not built; base exists |
| 9 | `/robotics-san-francisco-chinese.html` | `/robotics-san-francisco.html` | same |
| 10 | `/robotics-los-angeles-spanish.html` | `/robotics-los-angeles.html` | same |
| 11 | `/robotics-los-angeles-chinese.html` | `/robotics-los-angeles.html` | same |

### Tier 1 nginx rules (append to a `psdepot-product-redirects.conf` snippet)
```nginx
# Product / static 404 recoveries — Tier 1
location = /products.html { return 301 /products/; }
location = /contact { return 301 /contact.html; }
location = /privacy { return 301 /privacy.html; }
location = /categories/cash-drawers { return 301 /categories/; }
location = /categories/pos-scales/null { return 301 /categories/pos-scales/; }
location = /products/printer-ribbons { return 301 /categories/printer-ribbons/; }
location = /products/carbonless-paper { return 301 /products/CC-235-carbonless-paper.html; }
location = /robotics-san-francisco-spanish.html { return 301 /robotics-san-francisco.html; }
location = /robotics-san-francisco-chinese.html { return 301 /robotics-san-francisco.html; }
location = /robotics-los-angeles-spanish.html { return 301 /robotics-los-angeles.html; }
location = /robotics-los-angeles-chinese.html { return 301 /robotics-los-angeles.html; }
```

---

## TIER 2 — Best guess (confirm before shipping)

| # | Old URL (404) | → Proposed target | Why it's a guess |
|---|---|---|---|
| 12 | `/quote` | `/contact.html` | no dedicated quote page; contact is the closest action |
| 13 | `/support.html` | `/resources/faq.html` | no support.html; FAQ is the closest help resource |
| 14 | `/products/thermal-paper-carbon-free.html` | `/products/pf-230-phenol-free-thermal-paper.html` | "carbon-free" ≈ "phenol-free" clean paper |
| 15 | `/products/thermal-paper-2-25x85.html` | `/products/15-185-2-1-4-x-85-thermal.html` | 2.25" = 2-1/4" × 85 |
| 16 | `/products/3-125x220-kitchen-rolls.html` | `/products/thermal-paper.html` | no exact kitchen-roll SKU; generic thermal page |
| 17 | `/nuevo-mexico.html` | `/new-mexico.html` | old Spanish-name slug → English page (no `-spanish` variant exists for these states) |
| 18 | `/nueva-york.html` | `/new-york.html` | same |
| 19 | `/filadelfia.html` | `/philadelphia.html` | same |
| 20 | `/virginia-occidental.html` | `/west-virginia.html` | same |
| 21 | `/ecom/help.html`, `/ecom/billing.html` | `/ecom/` | internal ecom app — may not want public redirect |

### Tier 2 nginx rules (hold until confirmed)
```nginx
# Tier 2 — confirm before enabling
location = /quote { return 301 /contact.html; }
location = /support.html { return 301 /resources/faq.html; }
location = /products/thermal-paper-carbon-free.html { return 301 /products/pf-230-phenol-free-thermal-paper.html; }
location = /products/thermal-paper-2-25x85.html { return 301 /products/15-185-2-1-4-x-85-thermal.html; }
location = /products/3-125x220-kitchen-rolls.html { return 301 /products/thermal-paper.html; }
location = /nuevo-mexico.html { return 301 /new-mexico.html; }
location = /nueva-york.html { return 301 /new-york.html; }
location = /filadelfia.html { return 301 /philadelphia.html; }
location = /virginia-occidental.html { return 301 /west-virginia.html; }
```

---

## TIER 3 — Needs Captain's catalog knowledge

These old **descriptive** product slugs have no published replacement — the content only exists in `/staging/sam4s/` (not public) or was removed entirely.

| Old URL (404) | Situation | Options |
|---|---|---|
| `/products/mscashdrawer/sam4s-giant-100-receipt-printer.html` | Giant-100 only in `staging/sam4s/giant-100.html` | (a) publish the page, (b) redirect to `/products/mscashdrawer/`, (c) 410 Gone if discontinued |
| `/products/mscashdrawer/sam4s-hcube-receipt-printer.html` | hcube only in staging | same |
| `/products/mscashdrawer/sam4s-gcube-receipt-printer.html` | gcube only in staging | same |
| `/products/mscashdrawer/sam4s-ellix40ii-receipt-printer.html` | ellix40ii only in staging | same |
| `/products/30-215-sam-4s.html` | no 30-215 in catalog (jumps 30-204 → 30-216); "sam-4s" = SAM4S brand | confirm SKU; map to `/products/30-216-cash-register.html` or `/products/mscashdrawer/` |
| `/user_manual.pdf`, `/USER_MANUAL.pdf`, `/hardware_spec.pdf`, `/HARDWARE_SPEC.pdf` | PDFs missing | recreate or remove the links pointing to them |
| `/assets/images/cas-cl7200.jpg` | image missing | restore image or fix the `<img>` src |

### Tier 3 nginx (blocked pending Captain)
```nginx
# SAM4S printers — awaiting product decision (publish / redirect / 410)
location = /products/mscashdrawer/sam4s-giant-100-receipt-printer.html { return 301 /products/mscashdrawer/; }
location = /products/mscashdrawer/sam4s-hcube-receipt-printer.html { return 301 /products/mscashdrawer/; }
location = /products/mscashdrawer/sam4s-gcube-receipt-printer.html { return 301 /products/mscashdrawer/; }
location = /products/mscashdrawer/sam4s-ellix40ii-receipt-printer.html { return 301 /products/mscashdrawer/; }
```

---

## ASSETS TO CREATE (not redirects)

| Missing asset | Fix |
|---|---|
| `/favicon.ico` | Generate .ico from existing `favicon.svg` (or update `<link>` to only svg) |
| `/apple-touch-icon.png` (+ `-precomposed`) | Generate 180×180 PNG from favicon.svg |
| `/music/player.css` | Orphaned — no current HTML references; ignore or remove stale links |

---

## IGNORE (bot / attack noise — no action)

`wp-login.php`, `.git/config`, `/.well-known/traffic-advice`, `//wp-includes/*`, `wp-json/batch/v1`, `xmlrpc.php`, `/AGI_COMPANY/...`, `/ecom/*` (internal app), `/webui/`, `/wiki`.

---

## NEXT STEPS (proposed)

1. **Ship Tier 1** (11 rules) now — zero risk, recovers 11 dead URLs.
2. **Confirm Tier 2** (9 rules) — I'll ship once you sign off on the 4 "best guess" product targets (12–16) and the 4 Spanish-state targets (17–20).
3. **Decide Tier 3** — publish vs redirect vs 410 for the 5 SAM4S/30-215 products.
4. **Regenerate assets** — favicon.ico + apple-touch-icon.png.
5. Re-submit sitemap in Search Console after rules land.

*Flag: I can implement Tier 1 + generate the assets unilaterally (safe). Tier 2/3 need your call on the catalog.*
