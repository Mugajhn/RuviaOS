/**
 * RuviaOS Core — Auth, RBAC, Notifications, Activity Log, Dark Mode
 * Include this on every page: <script src="ruvia-core.js"></script>
 */

(function () {
  'use strict';

  // ─── DARK MODE (apply before paint — zero flicker) ───────────────────
  (function applyDarkMode() {
    const saved = localStorage.getItem('ruvia-dark');
    const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    const on = saved === null ? prefersDark : saved === '1';
    if (on) document.documentElement.classList.add('dark-mode-early');
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.classList.remove('dark-mode-early');
      if (on) document.body.classList.add('dark-mode');
    });
  })();

  // ─── ROLE DEFINITIONS ────────────────────────────────────────────────
  const ROLE_PERMISSIONS = {
    admin: {
      pages: ['*'],
      nav: ['frontdesk','pms','pos','dashboard','housekeeping','tables','stock','menu-management','reports','staff','backup-dashboard'],
      canViewFinancials: true,
      canViewStaff: true,
      canViewReports: true,
      canViewStock: true,
      canManageUsers: true,
      label: 'Administrator'
    },
    manager: {
      pages: ['frontdesk','pms','pos','dashboard','housekeeping','tables','stock','menu-management','reports','staff','backup-dashboard'],
      nav: ['frontdesk','pms','pos','dashboard','housekeeping','tables','stock','menu-management','reports','staff'],
      canViewFinancials: true,
      canViewStaff: true,
      canViewReports: true,
      canViewStock: true,
      canManageUsers: false,
      label: 'Manager'
    },
    reception: {
      pages: ['frontdesk','pms'],
      nav: ['frontdesk','pms'],
      canViewFinancials: false,
      canViewStaff: false,
      canViewReports: false,
      canViewStock: false,
      canManageUsers: false,
      label: 'Receptionist'
    },
    kitchen: {
      pages: ['pos','stock','menu-management'],
      nav: ['pos','stock','menu-management'],
      canViewFinancials: false,
      canViewStaff: false,
      canViewReports: false,
      canViewStock: true,
      canManageUsers: false,
      label: 'Kitchen Staff'
    },
    housekeeping: {
      pages: ['housekeeping'],
      nav: ['housekeeping'],
      canViewFinancials: false,
      canViewStaff: false,
      canViewReports: false,
      canViewStock: false,
      canManageUsers: false,
      label: 'Housekeeping'
    }
  };

  // ─── AUTH ─────────────────────────────────────────────────────────────
  const RuviaAuth = {
    isLoggedIn() {
      return localStorage.getItem('ruviaos_logged_in') === 'true';
    },
    getUser() {
      return localStorage.getItem('ruviaos_user') || '';
    },
    getRole() {
      return localStorage.getItem('ruviaos_role') || 'reception';
    },
    getPermissions() {
      const role = this.getRole();
      return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reception;
    },
    canAccess(page) {
      if (!this.isLoggedIn()) return false;
      const perms = this.getPermissions();
      if (perms.pages.includes('*')) return true;
      return perms.pages.some(p => page.includes(p));
    },
    login(username, role) {
      localStorage.setItem('ruviaos_logged_in', 'true');
      localStorage.setItem('ruviaos_user', username);
      localStorage.setItem('ruviaos_role', role);
      // Record attendance
      RuviaAttendance.recordLogin(username, role);
      RuviaActivity.log('login', `${username} signed in`, username, 'auth');
    },
    logout() {
      const user = this.getUser();
      RuviaActivity.log('logout', `${user} signed out`, user, 'auth');
      RuviaAttendance.recordLogout(user);
      ['ruviaos_logged_in','ruviaos_user','ruviaos_role'].forEach(k => localStorage.removeItem(k));
      window.location.href = 'login.html';
    },
    guard() {
      const page = window.location.pathname.split('/').pop().replace('.html','') || 'index';
      if (!this.isLoggedIn() && page !== 'login' && page !== 'index' && page !== '') {
        window.location.href = 'login.html';
        return false;
      }
      if (this.isLoggedIn() && page !== 'index' && page !== 'login' && page !== '') {
        if (!this.canAccess(page)) {
          document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#f0f2f5">
              <div style="text-align:center;padding:40px;background:#fff;border-radius:16px;max-width:400px">
                <div style="font-size:48px;margin-bottom:16px">🔒</div>
                <h2 style="color:#1a3c34;margin-bottom:8px">Access Restricted</h2>
                <p style="color:#666;margin-bottom:24px">Your role (${this.getPermissions().label}) does not have permission to view this page.</p>
                <a href="index.html" style="background:#2c5f4a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">← Back to Home</a>
              </div>
            </div>`;
          return false;
        }
      }
      return true;
    }
  };

  // ─── ATTENDANCE ───────────────────────────────────────────────────────
  const RuviaAttendance = {
    KEY: 'ruvia_attendance',
    getAll() {
      try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch(e) { return []; }
    },
    save(data) { localStorage.setItem(this.KEY, JSON.stringify(data)); },
    recordLogin(username, role) {
      const log = this.getAll();
      log.push({ username, role, event: 'login', time: new Date().toISOString(), date: new Date().toISOString().slice(0,10) });
      this.save(log);
    },
    recordLogout(username) {
      const log = this.getAll();
      log.push({ username, role: RuviaAuth.getRole(), event: 'logout', time: new Date().toISOString(), date: new Date().toISOString().slice(0,10) });
      this.save(log);
    },
    getTodayFor(username) {
      const today = new Date().toISOString().slice(0,10);
      return this.getAll().filter(r => r.username === username && r.date === today);
    },
    getFirstLoginToday(username) {
      const today = this.getTodayFor(username).filter(r => r.event === 'login');
      return today.length ? new Date(today[0].time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : null;
    }
  };

  // ─── ACTIVITY LOG ─────────────────────────────────────────────────────
  const RuviaActivity = {
    KEY: 'ruvia_activity_log',
    MAX: 500,
    getAll() {
      try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch(e) { return []; }
    },
    log(type, message, username, category) {
      const log = this.getAll();
      log.unshift({
        id: Date.now(),
        type,
        message,
        username: username || RuviaAuth.getUser() || 'System',
        category: category || 'general',
        time: new Date().toISOString()
      });
      localStorage.setItem(this.KEY, JSON.stringify(log.slice(0, this.MAX)));
      // Broadcast for live feeds
      try {
        localStorage.setItem('ruvia_activity_event', JSON.stringify({ type, message, time: Date.now() }));
        localStorage.removeItem('ruvia_activity_event');
      } catch(e) {}
    },
    getRecent(n) { return this.getAll().slice(0, n || 50); },
    clear() { localStorage.removeItem(this.KEY); }
  };

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────
  const RuviaNotifications = {
    KEY: 'ruvia_notifications',
    getAll() {
      try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch(e) { return []; }
    },
    save(data) { localStorage.setItem(this.KEY, JSON.stringify(data)); },
    add(targetUser, type, title, body, link) {
      const notes = this.getAll();
      notes.unshift({ id: Date.now(), targetUser, type, title, body, link: link||'', read: false, time: new Date().toISOString() });
      this.save(notes);
      RuviaActivity.log('notification', `Notification sent to ${targetUser}: ${title}`, RuviaAuth.getUser(), 'notification');
    },
    getForUser(username) {
      return this.getAll().filter(n => n.targetUser === username || n.targetUser === '*');
    },
    getUnreadCount(username) {
      return this.getForUser(username).filter(n => !n.read).length;
    },
    markRead(id) {
      const notes = this.getAll();
      const n = notes.find(x => x.id === id);
      if (n) { n.read = true; this.save(notes); }
    },
    markAllRead(username) {
      const notes = this.getAll();
      notes.filter(n => n.targetUser === username || n.targetUser === '*').forEach(n => n.read = true);
      this.save(notes);
    },
    getUnread(username) {
      return this.getForUser(username).filter(n => !n.read);
    }
  };

  // ─── DARK MODE TOGGLE ─────────────────────────────────────────────────
  function toggleDarkMode() {
    const on = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', on);
    localStorage.setItem('ruvia-dark', on ? '1' : '0');
    document.querySelectorAll('.ruvia-dark-btn').forEach(b => {
      b.textContent = on ? '☀ Light' : '🌙 Dark';
    });
  }

  // ─── AUTO-GUARD ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    RuviaAuth.guard();
  });

  // ─── EXPOSE GLOBALS ───────────────────────────────────────────────────
  window.RuviaAuth = RuviaAuth;
  window.RuviaAttendance = RuviaAttendance;
  window.RuviaActivity = RuviaActivity;
  window.RuviaNotifications = RuviaNotifications;
  window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
  window.toggleDarkMode = toggleDarkMode;

})();
