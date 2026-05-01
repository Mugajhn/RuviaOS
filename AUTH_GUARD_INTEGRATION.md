# RuviaOS — Auth Guard Integration Guide
## Feature: Auth Guard + Role-Based Access Control
### Files Delivered

| File | What it does |
|------|-------------|
| `ruvia-auth-guard.js` | Core guard — redirects to login if not authenticated, shows 403 if wrong role |
| `navbar.js` | Updated navbar — notification badges, profile pill, role-aware links, logout |
| `login.html` | Updated login — dark mode flicker fix, redirect-after-login, logout attendance |
| `permissions.html` | NEW page — manager UI to grant/revoke extra page access per employee |

---

## STEP 1 — Add the guard to every HTML page

Add this ONE line inside `<head>`, **before any other `<script>` tags** and **after your dark-mode inline script**:

```html
<script src="ruvia-auth-guard.js"></script>
```

### Exact position for each file:

#### dashboard.html / pms.html / pos.html / frontdesk.html / housekeeping.html
#### stock.html / menu-management.html / reports.html / staff.html / tables.html
#### backup-dashboard.html

Replace the existing dark-mode inline script block at the top of `<head>` with:

```html
<!-- DARK MODE FLICKER FIX (apply class, not just background) -->
<script>(function(){
  var s = localStorage.getItem('ruvia-dark');
  var p = window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
  if (s === '1' || (s === null && p)) {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.style.background = '#0f1117';
  }
})()</script>

<!-- AUTH GUARD — must load before anything else -->
<script src="ruvia-auth-guard.js"></script>
```

> **Why before other scripts?** The guard throws an error immediately if the user
> isn't logged in or doesn't have permission, stopping all subsequent scripts from
> running. This prevents data from rendering for a split second before the redirect.

---

## STEP 2 — Add `permissions.html` to your project

Copy `permissions.html` to your root folder (same level as `staff.html`).  
It is automatically linked from the navbar dropdown for admin and manager accounts.

---

## STEP 3 — Add the Permissions link to staff.html (optional)

Inside `staff.html`, add a link button in the `.page-hdr` section:

```html
<a href="permissions.html" class="btn-primary" style="text-decoration:none">
  🔐 Manage Permissions
</a>
```

---

## STEP 4 — How the permission system works

### Default role permissions (built into `ruvia-auth-guard.js`):

| Page | admin | manager | reception | kitchen | housekeeping |
|------|-------|---------|-----------|---------|--------------|
| index | ✅ | ✅ | ✅ | ✅ | ✅ |
| frontdesk | ✅ | ✅ | ✅ | ❌ | ❌ |
| pms | ✅ | ✅ | ✅ | ❌ | ❌ |
| pos | ✅ | ✅ | ✅ | ✅ | ❌ |
| tables | ✅ | ✅ | ✅ | ✅ | ❌ |
| housekeeping | ✅ | ✅ | ❌ | ❌ | ✅ |
| menu-management | ✅ | ✅ | ❌ | ✅ | ❌ |
| stock | ✅ | ✅ | ❌ | ✅ | ❌ |
| reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| backup-dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| permissions | ✅ | ✅ | ❌ | ❌ | ❌ |

### Dynamic permissions (manager-granted):

A manager can open `permissions.html` and toggle ON any page for any specific employee.
These are stored in `localStorage['ruvia_extra_permissions']` as:

```json
{
  "reception": ["reports"],
  "kitchen": ["stock", "reports"]
}
```

This means Alice (receptionist) has been personally granted access to Reports.

---

## STEP 5 — Using RuviaAuth in your page scripts

After the guard loads, `window.RuviaAuth` is available everywhere:

```javascript
// Get current user info
const user = RuviaAuth.getUser();       // "reception"
const role = RuviaAuth.getRole();       // "reception"
const meta = RuviaAuth.getRoleMeta();   // { label: "Receptionist", color: "#17a2b8", icon: "🏨" }

// Role checks
if (RuviaAuth.is('admin')) { /* show admin-only UI */ }
if (RuviaAuth.isAny('admin', 'manager')) { /* show financial data */ }
if (RuviaAuth.canAccess('reports')) { /* show reports link */ }

// Logout (also records attendance)
RuviaAuth.logout();

// Manager granting/revoking extra access
RuviaAuth.grantPermission('reception', 'reports');
RuviaAuth.revokePermission('reception', 'reports');
```

### Practical usage in index.html (already done partially):

```javascript
// Hide financial KPIs from non-managers
const canSeeFinance = RuviaAuth.isAny('admin', 'manager');
if (canSeeFinance) {
  // render revenue, outstanding balance tiles
}

// Restrict stock alerts
const canSeeStock = RuviaAuth.isAny('admin', 'manager', 'kitchen');
if (canSeeStock) {
  // render low stock alert bar
}
```

---

## STEP 6 — Adding new pages in future

When you add a new HTML page, just:
1. Add it to the `PAGE_PERMISSIONS` map in `ruvia-auth-guard.js`
2. Add it to `ALL_PAGES` array in `permissions.html`
3. Optionally add it to `NAV_LINKS` in `navbar.js`

---

## What the 403 screen looks like

When a logged-in employee tries to access a page they don't have permission for,
they see a clean 403 screen showing:
- Their current role badge
- Which roles have access to the page
- A "Go to Dashboard" button
- A "Sign Out" button

No page content ever loads — the guard throws immediately and replaces the body.

---

## Dark Mode Flicker Fix (already in login.html)

The fix is to apply `document.documentElement.classList.add('dark-mode')` 
instead of just `style.background`. This way `darkmode.css` picks up the
class instantly before any elements render, eliminating the white flash.

Make sure your `darkmode.css` uses `.dark-mode` class selectors on `:root` or `body`,
for example:
```css
body.dark-mode, .dark-mode body {
  --bg: #0f1117;
  --card: #1c2030;
  /* etc */
}
```
