# RS-80 Thermal Printer Test Protocol
**Version:** 1.0  
**Date:** 2026-06-10  
**Status:** READY FOR TESTING

---

## 📋 Overview

This document outlines the testing procedures for the ESC/POS thermal printer module in ReggieStarr RS-80.

## 🔧 Hardware Requirements

### Supported Printers
- **58mm thermal printers** (recommended)
- **80mm thermal printers** (compatible)
- ESC/POS command compatible
- Network (TCP/IP) connection

### Test Equipment
| Item | Specification | Qty |
|------|-------------|-----|
| Thermal printer | ESC/POS compatible | 1 |
| Thermal paper | 58mm width | 1 roll |
| Android device | API 26+ (Android 8.0) | 1 |
| Network connection | WiFi/Ethernet | 1 |

---

## 🧪 Test Procedures

### Test 1: Basic Connectivity
**Objective:** Verify printer network connection

1. Connect printer to same network as Android device
2. Note printer IP address (default: 192.168.1.100)
3. Ping printer from Android device
4. Verify port 9100 is open

**Expected Result:** Printer responds to ping, port 9100 accessible

---

### Test 2: ESC/POS Command Set
**Objective:** Verify ESC/POS commands work correctly

```kotlin
// Test code from PrinterService.kt
val testCommands = listOf(
    EscPosCmd.INIT,           // Initialize printer
    EscPosCmd.LEFT_ALIGN,      // Left align text
    "Test Line 1\n",
    EscPosCmd.CENTER_ALIGN,    // Center align
    "TEST RECEIPT\n",
    EscPosCmd.FEED_LINE,       // Feed one line
    EscPosCmd.FULL_CUT         // Full cut
)
```

**Expected Result:** Receipt prints with formatted text and clean cut

---

### Test 3: Receipt Format
**Objective:** Verify complete receipt layout

Test receipt includes:
- Store header (centered)
- Transaction number
- Item list with quantities
- Subtotal, tax, total
- Payment method
- Footer message
- Barcode (if applicable)

**Expected Result:** All elements printed clearly, properly aligned

---

### Test 4: Error Handling
**Objective:** Verify graceful failure when printer unavailable

1. Disable printer network connection
2. Attempt to print
3. Verify app doesn't crash
4. Check error log

**Expected Result:** Error logged, app continues functioning

---

## 📊 Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| 1. Connectivity | ⬜ PASS / ⬜ FAIL | |
| 2. ESC/POS Commands | ⬜ PASS / ⬜ FAIL | |
| 3. Receipt Format | ⬜ PASS / ⬜ FAIL | |
| 4. Error Handling | ⬜ PASS / ⬜ FAIL | |

**Overall Status:** ⬜ READY FOR PRODUCTION / ⬜ NEEDS WORK

---

## 🐛 Troubleshooting

### Issue: Printer not responding
**Solution:**
1. Check network connection
2. Verify IP address in PrinterService.kt
3. Ensure port 9100 is not blocked
4. Check printer power

### Issue: Garbled output
**Solution:**
1. Verify ESC/POS compatibility
2. Check character encoding (UTF-8)
3. Reduce print density

### Issue: Paper jams
**Solution:**
1. Use correct paper width (58mm)
2. Check paper path for debris
3. Verify paper roll installed correctly

---

## 📝 Implementation Notes

The ESC/POS module uses the `escpos-coffee` library:

```kotlin
dependencies {
    implementation 'com.github.anastaciocintra:escpos-coffee:4.1.0'
}
```

Key features implemented:
- TCP socket connection
- Text formatting (bold, underline, size)
- Alignment (left, center, right)
- Barcode printing
- Image printing (logo)
- Paper cutting

---

## ✅ Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | Chelios2 | | |
| QA Tester | | | |
| Project Lead | Miles | | |

**Next Steps After Testing:**
- [ ] Fix any identified issues
- [ ] Update PrinterService.kt with tested IP
- [ ] Document final printer settings
- [ ] Deploy to production
