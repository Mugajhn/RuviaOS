/**
 * RuviaOS — Navbar v3
 * Professional design with notification badges, RBAC nav, profile dropdown
 * Include: <script src="ruvia-core.js"></script><script src="navbar.js"></script>
 */
(function () {
  const PAGE_META = {
    'frontdesk':       { icon: '🏨', label: 'Front Desk',    badge: 'arrivals' },
    'pms':             { icon: '📅', label: 'Reservations',  badge: 'reservations' },
    'pos':             { icon: '🍽', label: 'POS',           badge: null },
    'dashboard':       { icon: '📊', label: 'Dashboard',     badge: null },
    'housekeeping':    { icon: '🧹', label: 'Housekeeping',  badge: 'dirty' },
    'tables':          { icon: '🪑', label: 'Tables',        badge: null },
    'stock':           { icon: '📦', label: 'Stock',         badge: 'lowstock' },
    'menu-management': { icon: '📋', label: 'Menu',          badge: null },
    'reports':         { icon: '📄', label: 'Reports',       badge: null },
    'staff':           { icon: '👥', label: 'Staff',         badge: null },
  };

  function getBadgeCount(type) {
    if (!window.RuviaStore) return 0;
    try {
      if (type === 'arrivals') {
        const today = new Date().toISOString().slice(0,10);
        return RuviaStore.getReservations().filter(r => r.status === 'confirmed' && r.check_in <= today).length;
      }
      if (type === 'dirty') {
        return RuviaStore.getRooms().filter(r => r.status === 'dirty' || r.status === 'cleaning').length;
      }
      if (type === 'lowstock') {
        return RuviaStore.getProducts().filter(p => p.current_stock <= p.reorder_level).length;
      }
    } catch(e) {}
    return 0;
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  }

  function getRoleColor(role) {
    const colors = { admin:'#dc3545', manager:'#e0a800', reception:'#17a2b8', kitchen:'#28a745', housekeeping:'#6c757d' };
    return colors[role] || '#2c5f4a';
  }

  function inject() {
    const loggedIn = window.RuviaAuth ? RuviaAuth.isLoggedIn() : localStorage.getItem('ruviaos_logged_in') === 'true';
    const user = window.RuviaAuth ? RuviaAuth.getUser() : (localStorage.getItem('ruviaos_user') || '');
    const role = window.RuviaAuth ? RuviaAuth.getRole() : (localStorage.getItem('ruviaos_role') || 'reception');
    const perms = window.ROLE_PERMISSIONS ? (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reception) : { nav: Object.keys(PAGE_META), label: 'Staff' };
    const isDark = document.body.classList.contains('dark-mode');
    const cur = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const notifCount = window.RuviaNotifications ? RuviaNotifications.getUnreadCount(user) : 0;
    const loginTime = window.RuviaAttendance ? RuviaAttendance.getFirstLoginToday(user) : null;

    const allowedNav = perms.nav === ['*'] || perms.pages?.includes('*')
      ? Object.keys(PAGE_META)
      : (perms.nav || []);

    const navLinks = allowedNav.map(key => {
      const meta = PAGE_META[key];
      if (!meta) return '';
      const isActive = cur === key;
      const badge = meta.badge ? getBadgeCount(meta.badge) : 0;
      return `<a href="${key}.html" class="rnav-link${isActive ? ' active' : ''}" title="${meta.label}">
        <span class="rnav-icon">${meta.icon}</span>
        <span class="rnav-lbl">${meta.label}</span>
        ${badge > 0 ? `<span class="rnav-badge">${badge}</span>` : ''}
      </a>`;
    }).join('');

    const html = `
<style>
.rnav{background:#1a3c34;color:#fff;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:54px;position:sticky;top:0;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.rnav-logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff;font-size:16px;font-weight:600;flex-shrink:0;white-space:nowrap}
.rnav-logo-icon{width:30px;height:30px;background:rgba(255,255,255,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
.rnav-links{display:flex;align-items:center;gap:2px;overflow-x:auto;flex:1;margin:0 12px;scrollbar-width:none}
.rnav-links::-webkit-scrollbar{display:none}
.rnav-link{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:7px;text-decoration:none;color:rgba(255,255,255,.75);font-size:12px;white-space:nowrap;transition:all .15s;position:relative;flex-shrink:0}
.rnav-link:hover,.rnav-link.active{background:rgba(255,255,255,.15);color:#fff}
.rnav-link.active{background:rgba(255,255,255,.2)}
.rnav-icon{font-size:14px;line-height:1}
.rnav-lbl{display:none}
@media(min-width:1100px){.rnav-lbl{display:inline}}
.rnav-badge{position:absolute;top:2px;right:2px;background:#e05c5c;color:#fff;border-radius:20px;font-size:9px;font-weight:700;min-width:14px;height:14px;display:flex;align-items:center;justify-content:center;padding:0 3px;line-height:1}
.rnav-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.rnav-notif-btn{background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:7px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;transition:background .15s}
.rnav-notif-btn:hover{background:rgba(255,255,255,.2)}
.rnav-notif-badge{position:absolute;top:-2px;right:-2px;background:#e05c5c;color:#fff;border-radius:20px;font-size:9px;font-weight:700;min-width:14px;height:14px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:2px solid #1a3c34}
.rnav-dark-btn{background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:12px;transition:background .15s}
.rnav-dark-btn:hover{background:rgba(255,255,255,.2)}
.rnav-profile{display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 8px;border-radius:8px;transition:background .15s;position:relative}
.rnav-profile:hover{background:rgba(255,255,255,.1)}
.rnav-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;border:2px solid rgba(255,255,255,.3)}
.rnav-uinfo{display:none;line-height:1.3}
@media(min-width:900px){.rnav-uinfo{display:block}}
.rnav-uname{font-size:12px;font-weight:600;color:#fff}
.rnav-urole{font-size:10px;color:rgba(255,255,255,.6)}
.rnav-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:10px;min-width:220px;box-shadow:0 8px 24px rgba(0,0,0,.2);display:none;z-index:1000;overflow:hidden}
body.dark-mode .rnav-dropdown{background:#1c2030;border:1px solid rgba(255,255,255,.1)}
.rnav-dropdown.open{display:block}
.rnav-dd-header{padding:14px;background:#f8f9fa;border-bottom:1px solid #eee}
body.dark-mode .rnav-dd-header{background:#252535;border-color:rgba(255,255,255,.08)}
.rnav-dd-name{font-size:13px;font-weight:600;color:#222}
body.dark-mode .rnav-dd-name{color:#e2e4ea}
.rnav-dd-role{font-size:11px;color:#666;margin-top:2px}
body.dark-mode .rnav-dd-role{color:#9a9da8}
.rnav-dd-login{font-size:11px;color:#999;margin-top:2px}
.rnav-dd-item{padding:10px 14px;font-size:13px;color:#333;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f0f0f0;transition:background .1s}
body.dark-mode .rnav-dd-item{color:#e2e4ea;border-color:rgba(255,255,255,.06)}
.rnav-dd-item:hover{background:#f5f5f5}
body.dark-mode .rnav-dd-item:hover{background:#252535}
.rnav-dd-item:last-child{border-bottom:none;color:#dc3545}
.rnav-notif-panel{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:10px;width:300px;box-shadow:0 8px 24px rgba(0,0,0,.2);display:none;z-index:1001;overflow:hidden;max-height:400px;overflow-y:auto}
body.dark-mode .rnav-notif-panel{background:#1c2030;border:1px solid rgba(255,255,255,.1)}
.rnav-notif-panel.open{display:block}
.rnav-notif-hdr{padding:12px 14px;font-size:13px;font-weight:600;color:#222;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;position:sticky;top:0}
body.dark-mode .rnav-notif-hdr{background:#252535;color:#e2e4ea;border-color:rgba(255,255,255,.08)}
.rnav-notif-clr{font-size:11px;color:#2c5f4a;cursor:pointer;font-weight:400}
.rnav-notif-item{padding:10px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background .1s}
body.dark-mode .rnav-notif-item{border-color:rgba(255,255,255,.06)}
.rnav-notif-item:hover{background:#f5f5f5}
body.dark-mode .rnav-notif-item:hover{background:#252535}
.rnav-notif-item.unread{background:#e8f5e9}
body.dark-mode .rnav-notif-item.unread{background:#162318}
.rnav-notif-title{font-size:12px;font-weight:600;color:#222}
body.dark-mode .rnav-notif-title{color:#e2e4ea}
.rnav-notif-body{font-size:11px;color:#666;margin-top:2px}
body.dark-mode .rnav-notif-body{color:#9a9da8}
.rnav-notif-time{font-size:10px;color:#aaa;margin-top:3px}
.rnav-empty{padding:24px;text-align:center;font-size:12px;color:#999}
body.dark-mode .rnav-empty{color:#9a9da8}
html.dark-mode-early body{background:#111318!important;color:#e2e4ea!important}
</style>

<nav class="rnav" id="rnav">
  <a href="index.html" class="rnav-logo">
    <div class="rnav-logo-icon">🏨</div>
    <span>RuviaOS</span>
  </a>

  ${loggedIn ? `<div class="rnav-links">${navLinks}</div>` : '<div class="rnav-links"></div>'}

  <div class="rnav-right">
    <button class="rnav-dark-btn ruvia-dark-btn" onclick="toggleDarkMode()" id="ruviaDarkBtn">${isDark ? '☀ Light' : '🌙 Dark'}</button>

    ${loggedIn ? `
    <div style="position:relative" id="rnavNotifWrap">
      <button class="rnav-notif-btn" onclick="rnavToggleNotif()" title="Notifications">
        🔔
        ${notifCount > 0 ? `<span class="rnav-notif-badge">${notifCount}</span>` : ''}
      </button>
      <div class="rnav-notif-panel" id="rnavNotifPanel">
        <div class="rnav-notif-hdr">
          <span>Notifications</span>
          <span class="rnav-notif-clr" onclick="rnavClearNotifs()">Mark all read</span>
        </div>
        <div id="rnavNotifList"></div>
      </div>
    </div>

    <div class="rnav-profile" onclick="rnavToggleDropdown()" id="rnavProfileBtn">
      <div class="rnav-avatar" style="background:${getRoleColor(role)}">${getInitials(user)}</div>
      <div class="rnav-uinfo">
        <div class="rnav-uname">${user}</div>
        <div class="rnav-urole">${perms.label || role}</div>
      </div>
      <div class="rnav-dropdown" id="rnavDropdown">
        <div class="rnav-dd-header">
          <div class="rnav-dd-name">${user}</div>
          <div class="rnav-dd-role">${perms.label || role}</div>
          ${loginTime ? `<div class="rnav-dd-login">Signed in today at ${loginTime}</div>` : ''}
        </div>
        <div class="rnav-dd-item" onclick="window.location.href='staff.html'">👤 My Profile</div>
        <div class="rnav-dd-item" onclick="rnavToggleDark()">🌙 Toggle Dark Mode</div>
        ${perms.canManageUsers || role === 'admin' || role === 'manager' ? `<div class="rnav-dd-item" onclick="window.location.href='staff.html'">⚙ Manage Staff</div>` : ''}
        <div class="rnav-dd-item" onclick="rnavLogout()" style="color:#dc3545!important">🚪 Sign Out</div>
      </div>
    </div>
    ` : `<a href="login.html" style="background:#ffc107;color:#333;padding:7px 16px;border-radius:7px;font-size:12px;font-weight:700;text-decoration:none">🔐 Login</a>`}
  </div>
</nav>`;

    const ph = document.getElementById('navbar-placeholder');
    if (ph) ph.innerHTML = html;
    else {
      const d = document.createElement('div');
      d.innerHTML = html;
      document.body.insertBefore(d.firstChild, document.body.firstChild);
    }

    renderNotifs(user);
  }

  function renderNotifs(user) {
    const list = document.getElementById('rnavNotifList');
    if (!list || !window.RuviaNotifications) return;
    const notifs = RuviaNotifications.getForUser(user).slice(0, 20);
    if (!notifs.length) {
      list.innerHTML = '<div class="rnav-empty">No notifications</div>';
      return;
    }
    list.innerHTML = notifs.map(n => {
      const t = new Date(n.time);
      const timeStr = t.toLocaleDateString() === new Date().toLocaleDateString()
        ? t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
        : t.toLocaleDateString();
      return `<div class="rnav-notif-item ${n.read ? '' : 'unread'}" onclick="rnavReadNotif(${n.id},'${n.link}')">
        <div class="rnav-notif-title">${n.title}</div>
        <div class="rnav-notif-body">${n.body}</div>
        <div class="rnav-notif-time">${timeStr}</div>
      </div>`;
    }).join('');
  }

  // Global functions used in template
  window.rnavToggleDropdown = function() {
    document.getElementById('rnavDropdown')?.classList.toggle('open');
    document.getElementById('rnavNotifPanel')?.classList.remove('open');
  };
  window.rnavToggleNotif = function() {
    document.getElementById('rnavNotifPanel')?.classList.toggle('open');
    document.getElementById('rnavDropdown')?.classList.remove('open');
    const user = window.RuviaAuth ? RuviaAuth.getUser() : localStorage.getItem('ruviaos_user');
    renderNotifs(user);
  };
  window.rnavClearNotifs = function() {
    const user = window.RuviaAuth ? RuviaAuth.getUser() : localStorage.getItem('ruviaos_user');
    if (window.RuviaNotifications) RuviaNotifications.markAllRead(user);
    renderNotifs(user);
    document.querySelectorAll('.rnav-notif-badge').forEach(b => b.remove());
  };
  window.rnavReadNotif = function(id, link) {
    if (window.RuviaNotifications) RuviaNotifications.markRead(id);
    if (link) window.location.href = link;
    document.getElementById('rnavNotifPanel')?.classList.remove('open');
  };
  window.rnavLogout = function() {
    if (window.RuviaAuth) RuviaAuth.logout();
    else { ['ruviaos_logged_in','ruviaos_user','ruviaos_role'].forEach(k => localStorage.removeItem(k)); window.location.href = 'login.html'; }
  };
  window.rnavToggleDark = toggleDarkMode;

  document.addEventListener('click', e => {
    if (!e.target.closest('#rnavProfileBtn')) document.getElementById('rnavDropdown')?.classList.remove('open');
    if (!e.target.closest('#rnavNotifWrap')) document.getElementById('rnavNotifPanel')?.classList.remove('open');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();

  function toggleDarkMode() {
    const on = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', on);
    localStorage.setItem('ruvia-dark', on ? '1' : '0');
    document.querySelectorAll('.rnav-dark-btn, .ruvia-dark-btn').forEach(b => { b.textContent = on ? '☀ Light' : '🌙 Dark'; });
    if (window.toggleDarkMode && window.toggleDarkMode !== toggleDarkMode) window.toggleDarkMode = toggleDarkMode;
  }
  window.toggleDarkMode = toggleDarkMode;

})();
