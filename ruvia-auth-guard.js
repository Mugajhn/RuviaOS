/**
 * RuviaOS — Auth Guard & Role-Based Access Control
 * =================================================
 * Drop  <script src="ruvia-auth-guard.js"></script>
 * as the VERY FIRST script tag inside <head> on every protected page.
 *
 * How it works:
 *  1. Reads ruviaos_logged_in + ruviaos_role from localStorage
 *  2. Redirects to login.html if not authenticated
 *  3. Checks page-level role permission; shows 403 screen if not allowed
 *  4. Exposes window.RuviaAuth for the rest of the page to use
 */

(function () {
  'use strict';

  // ─── 1. PERMISSION MAP ────────────────────────────────────────────────────
  // Maps filename (without .html) → array of roles allowed to access it.
  // '*' means any authenticated user.
  // Add new pages here as you build them.
  const PAGE_PERMISSIONS = {
    'index':            ['*'],
    'dashboard':        ['admin', 'manager'],
    'frontdesk':        ['admin', 'manager', 'reception'],
    'pms':              ['admin', 'manager', 'reception'],
    'pos':              ['admin', 'manager', 'kitchen', 'reception'],
    'tables':           ['admin', 'manager', 'kitchen', 'reception'],
    'housekeeping':     ['admin', 'manager', 'housekeeping'],
    'menu-management':  ['admin', 'manager', 'kitchen'],
    'stock':            ['admin', 'manager', 'kitchen'],
    'reports':          ['admin', 'manager'],
    'staff':            ['admin', 'manager'],
    'backup-dashboard': ['admin'],
    // Add more as needed — unregistered pages are open to any logged-in user
  };

  // ─── 2. ROLE META ─────────────────────────────────────────────────────────
  const ROLE_META = {
    admin:        { label: 'Administrator',   color: '#dc3545', icon: '🔑' },
    manager:      { label: 'Manager',         color: '#e0a800', icon: '📊' },
    reception:    { label: 'Receptionist',    color: '#17a2b8', icon: '🏨' },
    kitchen:      { label: 'Kitchen Staff',   color: '#28a745', icon: '🍳' },
    housekeeping: { label: 'Housekeeping',    color: '#6c757d', icon: '🧹' },
  };

  // ─── 3. SESSION HELPERS ───────────────────────────────────────────────────
  function getSession() {
    return {
      loggedIn:  localStorage.getItem('ruviaos_logged_in') === 'true',
      user:      localStorage.getItem('ruviaos_user')      || '',
      role:      localStorage.getItem('ruviaos_role')      || '',
      loginTime: localStorage.getItem('ruviaos_login_time')|| '',
    };
  }

  function getCurrentPage() {
    // e.g. "pms.html" → "pms", "index.html" → "index"
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '') || 'index';
    return file;
  }

  // ─── 4. REDIRECT TO LOGIN ─────────────────────────────────────────────────
  function redirectToLogin() {
    const current = encodeURIComponent(window.location.href);
    window.location.replace('login.html?redirect=' + current);
  }

  // ─── 5. 403 FORBIDDEN SCREEN ─────────────────────────────────────────────
  function show403(role, page, allowedRoles) {
    const meta = ROLE_META[role] || { label: role, color: '#6b7280', icon: '👤' };
    document.documentElement.style.background = '#f4f6f9';

    // Wait for body to exist before injecting
    function inject() {
      document.body.innerHTML = `
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #f4f6f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .err-card {
            background: #fff;
            border-radius: 20px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 8px 40px rgba(0,0,0,.12);
            border: 1px solid #e5e7eb;
          }
          .err-icon { font-size: 64px; margin-bottom: 16px; display: block; }
          .err-code { font-size: 80px; font-weight: 800; color: #e5e7eb; line-height: 1; margin-bottom: 8px; }
          .err-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
          .err-sub { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 24px; }
          .role-badge {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 700;
            background: ${meta.color}22; color: ${meta.color};
            margin-bottom: 24px; border: 1px solid ${meta.color}44;
          }
          .err-allowed {
            background: #f9fafb; border-radius: 10px; padding: 12px 16px;
            font-size: 12px; color: #6b7280; margin-bottom: 28px;
            text-align: left;
          }
          .err-allowed strong { color: #1a1a2e; display: block; margin-bottom: 6px; }
          .err-allowed span {
            display: inline-block; background: #e5e7eb; padding: 2px 8px;
            border-radius: 20px; margin: 2px; font-size: 11px; font-weight: 600; color: #374151;
          }
          .btn-home {
            display: inline-block; background: linear-gradient(135deg, #2c5f4a, #1a3c34);
            color: #fff; border: none; padding: 13px 32px; border-radius: 12px;
            font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none;
            transition: all .2s; margin-right: 8px;
          }
          .btn-home:hover { opacity: .9; transform: translateY(-1px); }
          .btn-logout {
            display: inline-block; background: transparent;
            border: 1.5px solid #e5e7eb; color: #6b7280;
            padding: 12px 24px; border-radius: 12px;
            font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
            transition: all .2s;
          }
          .btn-logout:hover { border-color: #dc3545; color: #dc3545; }
        </style>
        <div class="err-card">
          <span class="err-icon">🚫</span>
          <div class="err-code">403</div>
          <div class="err-title">Access Denied</div>
          <div class="err-sub">
            You don't have permission to access <strong>${page}.html</strong>.
            Your current role does not include this module.
          </div>
          <div class="role-badge">${meta.icon} ${meta.label}</div>
          <div class="err-allowed">
            <strong>This page is accessible to:</strong>
            ${allowedRoles.map(r => `<span>${ROLE_META[r]?.label || r}</span>`).join('')}
          </div>
          <a href="index.html" class="btn-home">🏠 Go to Dashboard</a>
          <a href="#" class="btn-logout" onclick="
            localStorage.removeItem('ruviaos_logged_in');
            localStorage.removeItem('ruviaos_user');
            localStorage.removeItem('ruviaos_role');
            window.location.href='login.html';
            return false;
          ">Sign Out</a>
        </div>
      `;
      document.title = '403 — Access Denied · RuviaOS';
    }

    if (document.body) {
      inject();
    } else {
      document.addEventListener('DOMContentLoaded', inject);
    }
  }

  // ─── 6. ROLE-PERMISSION CHECK ─────────────────────────────────────────────
  function hasPermission(role, page) {
    const allowed = PAGE_PERMISSIONS[page];
    if (!allowed) return true; // unregistered page: allow any authenticated user
    if (allowed.includes('*')) return true;
    return allowed.includes(role);
  }

  // ─── 7. DYNAMIC PERMISSIONS (manager-granted extras) ─────────────────────
  // Managers can grant a user access to extra pages beyond their base role.
  // Stored as: ruvia_extra_permissions = { "reception": ["reports"], ... }
  function getDynamicPermissions(username) {
    try {
      const map = JSON.parse(localStorage.getItem('ruvia_extra_permissions') || '{}');
      return map[username] || [];
    } catch (e) { return []; }
  }

  function hasPermissionWithDynamic(role, username, page) {
    if (hasPermission(role, page)) return true;
    const extras = getDynamicPermissions(username);
    return extras.includes(page);
  }

  // ─── 8. GRANT / REVOKE EXTRA PERMISSIONS (for manager dashboard) ──────────
  function grantPermission(username, page) {
    try {
      const map = JSON.parse(localStorage.getItem('ruvia_extra_permissions') || '{}');
      if (!map[username]) map[username] = [];
      if (!map[username].includes(page)) map[username].push(page);
      localStorage.setItem('ruvia_extra_permissions', JSON.stringify(map));
      return true;
    } catch (e) { return false; }
  }

  function revokePermission(username, page) {
    try {
      const map = JSON.parse(localStorage.getItem('ruvia_extra_permissions') || '{}');
      if (map[username]) map[username] = map[username].filter(p => p !== page);
      localStorage.setItem('ruvia_extra_permissions', JSON.stringify(map));
      return true;
    } catch (e) { return false; }
  }

  function getUserPermissions(username, role) {
    const base = Object.entries(PAGE_PERMISSIONS)
      .filter(([page, roles]) => roles.includes('*') || roles.includes(role))
      .map(([page]) => page);
    const extras = getDynamicPermissions(username);
    return [...new Set([...base, ...extras])];
  }

  // ─── 9. MAIN GUARD EXECUTION ──────────────────────────────────────────────
  const session  = getSession();
  const page     = getCurrentPage();
  const isLogin  = page === 'login';

  // Don't guard the login page itself
  if (!isLogin) {
    if (!session.loggedIn) {
      redirectToLogin();
      // Stop all further script execution by throwing
      throw new Error('[RuviaAuth] Not authenticated — redirecting to login.');
    }

    const allowed = hasPermissionWithDynamic(session.role, session.user, page);
    if (!allowed) {
      const allowedRoles = PAGE_PERMISSIONS[page] || ['admin'];
      show403(session.role, page, allowedRoles);
      throw new Error('[RuviaAuth] Access denied for role "' + session.role + '" on page "' + page + '".');
    }
  }

  // ─── 10. PUBLIC API ───────────────────────────────────────────────────────
  window.RuviaAuth = {
    // Session info
    getSession,
    getUser:   () => session.user,
    getRole:   () => session.role,
    isLoggedIn:() => session.loggedIn,

    // Role checks
    is:        (role)    => session.role === role,
    isAny:     (...roles)=> roles.includes(session.role),
    canAccess: (pg)      => hasPermissionWithDynamic(session.role, session.user, pg),

    // Dynamic permission management (call from manager dashboard)
    grantPermission,
    revokePermission,
    getUserPermissions: (u, r) => getUserPermissions(u || session.user, r || session.role),

    // Role meta
    getRoleMeta: (r) => ROLE_META[r || session.role] || { label: r, color: '#6b7280', icon: '👤' },
    ALL_ROLES:   Object.keys(ROLE_META),
    ROLE_META,
    PAGE_PERMISSIONS,

    // Logout helper
    logout() {
      // Record logout in attendance
      try {
        const log = JSON.parse(localStorage.getItem('ruvia_attendance') || '[]');
        log.push({
          username: session.user,
          role:     session.role,
          event:    'logout',
          time:     new Date().toISOString(),
          date:     new Date().toISOString().slice(0, 10),
        });
        localStorage.setItem('ruvia_attendance', JSON.stringify(log));
      } catch (e) {}
      // Activity log
      try {
        const al = JSON.parse(localStorage.getItem('ruvia_activity_log') || '[]');
        al.unshift({
          id: Date.now(), type: 'logout',
          message: session.user + ' signed out',
          username: session.user, category: 'auth',
          time: new Date().toISOString(),
        });
        localStorage.setItem('ruvia_activity_log', JSON.stringify(al.slice(0, 500)));
      } catch (e) {}
      localStorage.removeItem('ruviaos_logged_in');
      localStorage.removeItem('ruviaos_user');
      localStorage.removeItem('ruviaos_role');
      localStorage.removeItem('ruviaos_login_time');
      window.location.href = 'login.html';
    },
  };

})();
