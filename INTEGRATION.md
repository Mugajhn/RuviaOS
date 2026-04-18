# RuviaOS — Enhancement Guide

## New Files (drop into your project root)

| File | Purpose |
|------|---------|
| `ruvia-core.js` | Auth, RBAC, attendance, activity log, notifications |
| `navbar.js` | New navbar with badges, profile dropdown, notifications |
| `ruvia-receipt.js` | Print/preview receipt with cashier, VAT, optional fields |
| `ruvia-statusbar.js` | Live activity feed for homepage |
| `ruvia-rate-calc.js` | Room rate calculator with seasonal pricing |
| `ruvia-menu-print.js` | Printable menu + QR code generator |
| `darkmode.css` | New CSS with zero-flicker dark mode |
| `login.html` | Professional login with RBAC, attendance tracking |
| `index.html` | New homepage with status bar, activity feed, RBAC |

---

## Integration — Every HTML Page

Add these two lines in `<head>` (before other scripts):

```html
<script src="ruvia-core.js"></script>
```

In `<body>`:
```html
<div id="navbar-placeholder"></div>
<script src="navbar.js"></script>
```

---

## Role-Based Access

Roles and their access:
- **admin** — everything
- **manager** — everything except user management
- **reception** — frontdesk, pms only
- **kitchen** — pos, stock, menu-management
- **housekeeping** — housekeeping only

The auth guard in `ruvia-core.js` auto-redirects unauthorized pages.

---

## Receipt System

In `pos.html`, replace the receipt modal with:

```javascript
// After saving an order:
RuviaReceipt.show(orderData);
// orderData = { order_number, items:[{name,quantity,unit_price}], 
//               total, payment_method, order_type, table, guest_name,
//               cashier: RuviaAuth.getUser() }
```

---

## Activity Log

Log any action:
```javascript
RuviaActivity.log('sale', 'Order ORD-0012 for USh 45,000', RuviaAuth.getUser(), 'pos');
RuviaActivity.log('checkin', 'Guest John Smith checked into Room 201', 'reception', 'pms');
```

---

## Notifications

Send a notification to a staff member:
```javascript
// Manager assigns housekeeping task:
RuviaNotifications.add('housekeeping', 'task', 'Room 303 needs cleaning', 
  'Please clean Room 303 before 14:00', 'housekeeping.html');

// Notify all:
RuviaNotifications.add('*', 'alert', 'Low stock alert', 'Beer stock is critical');
```

---

## Room Rate Calculator

Add to `pms.html` or `frontdesk.html`:
```html
<div id="ruvia-rate-calc"></div>
<script src="ruvia-rate-calc.js"></script>
<script>
  RuviaRateCalc.show('ruvia-rate-calc', room.base_price, checkIn, checkOut);
</script>
```

---

## Menu Print & QR

Add to `menu-management.html`:
```html
<script src="ruvia-menu-print.js"></script>
<button onclick="RuviaMenuPrint.show()">🖨 Print Menu / QR Code</button>
```

---

## Attendance Tracking

Auto-logged on login. Access in staff management:
```javascript
const log = RuviaAttendance.getAll();
// Filter by user/date, export to CSV
```

---

## Dark Mode Fix

The new `ruvia-core.js` applies dark mode class to `<html>` before the 
page renders — eliminating the white flash. No other changes needed.

---

## PMS Tile Fix

In `pms.html`, the stat tiles just need `onclick` handlers linking to the
correct tab. Example:
```html
<div class="stat-card" onclick="showTab('rooms', document.querySelector('.tab'))">
```

---

## Suggested Additional Files to Update

1. **`pos.html`** — add `RuviaReceipt.show(order)` after order confirmation
2. **`pms.html`** — add rate calculator, fix tile clicks, add booking flow
3. **`frontdesk.html`** — add booking quick-form
4. **`staff.html`** — add profile pic upload, attendance view, notifications panel
5. **`menu-management.html`** — add print/QR button, image upload option
