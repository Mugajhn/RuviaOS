/**
 * RuviaOS — Navbar
 * ================
 * Renders the top navigation bar on every page.
 * Reads login state, role, and notifications from localStorage.
 * Works with ruvia-auth-guard.js (uses RuviaAuth.logout() when available).
 *
 * Usage (already in every .html file):
 *   <div id="navbar-placeholder"></div>
 *   <script src="ruvia-core.js"></script>
 *   <script src="navbar.js"></script>
 */

(function () {
  'use strict';

  // ── Role metadata ────────────────────────────────────────────────────────
  const ROLE_META = {
    admin:        { label: 'Administrator', color: '#dc3545', icon: '🔑' },
    manager:      { label: 'Manager',       color: '#e0a800', icon: '📊' },
    reception:    { label: 'Receptionist',  color: '#17a2b8', icon: '🏨' },
    kitchen:      { label: 'Kitchen Staff', color: '#28a745', icon: '🍳' },
    housekeeping: { label: 'Housekeeping',  color: '#6c757d', icon: '🧹' },
  };

  // ── Nav links per role ───────────────────────────────────────────────────
  // Each entry: { href, icon, label, roles ([] = all), badge (optional key) }
  const NAV_LINKS = [
    { href:'index.html',           icon:'🏠', label:'Dashboard',   roles:[] },
    { href:'frontdesk.html',       icon:'🏨', label:'Front Desk',  roles:['admin','manager','reception'],     badge:'arrivals' },
    { href:'pms.html',             icon:'📅', label:'Reservations',roles:['admin','manager','reception'] },
    { href:'pos.html',             icon:'🍽', label:'POS',         roles:['admin','manager','kitchen','reception'] },
    { href:'housekeeping.html',    icon:'🧹', label:'Housekeeping',roles:['admin','manager','housekeeping'],   badge:'dirty' },
    { href:'tables.html',          icon:'🪑', label:'Tables',      roles:['admin','manager','kitchen','reception'] },
    { href:'stock.html',           icon:'📦', label:'Stock',       roles:['admin','manager','kitchen'],        badge:'lowstock' },
    { href:'menu-management.html', icon:'📋', label:'Menu',        roles:['admin','manager','kitchen'] },
    { href:'reports.html',         icon:'📈', label:'Reports',     roles:['admin','manager'] },
    { href:'staff.html',           icon:'👥', label:'Staff',       roles:['admin','manager'] },
    { href:'backup-dashboard.html',icon:'💾', label:'Backup',      roles:['admin'] },
  ];

  // ── Badge value calculators ──────────────────────────────────────────────
  function getBadge(key) {
    try {
      switch (key) {
        case 'arrivals': {
          const today = new Date().toISOString().slice(0, 10);
          const res = JSON.parse(localStorage.getItem('ruvia_reservations') || '[]');
          return res.filter(r => r.status === 'confirmed' && r.check_in <= today).length;
        }
        case 'dirty': {
          const rooms = JSON.parse(localStorage.getItem('ruvia_rooms') || '[]');
          return rooms.filter(r => r.status === 'dirty' || r.status === 'cleaning').length;
        }
        case 'lowstock': {
          const products = JSON.parse(localStorage.getItem('ruvia_products') || '[]');
          return products.filter(p => p.current_stock <= (p.reorder_level || 5)).length;
        }
        case 'notifications': {
          const user = localStorage.getItem('ruviaos_user') || '';
          const role = localStorage.getItem('ruviaos_role') || '';
          const notes = JSON.parse(localStorage.getItem('ruvia_notifications') || '[]');
          return notes.filter(n =>
            !n.read && (n.targetUser === '*' || n.targetUser === user || n.targetUser === role)
          ).length;
        }
        default: return 0;
      }
    } catch (e) { return 0; }
  }

  // ── Current page detection ───────────────────────────────────────────────
  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  // ── Get staff profile for logged-in user ─────────────────────────────────
  function getProfile(username) {
    try {
      const staff = JSON.parse(localStorage.getItem('ruvia_staff') || '[]');
      return staff.find(s => s.username === username) || null;
    } catch (e) { return null; }
  }

  // ── Build and inject navbar ───────────────────────────────────────────────
  function build() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    const loggedIn = localStorage.getItem('ruviaos_logged_in') === 'true';
    const user     = localStorage.getItem('ruviaos_user') || '';
    const role     = localStorage.getItem('ruviaos_role') || '';
    const meta     = ROLE_META[role] || { label: role, color: '#6b7280', icon: '👤' };
    const profile  = getProfile(user);

    // Get extra permissions for this user
    function canAccessPage(href) {
      const pageKey = href.replace('.html', '');
      if (window.RuviaAuth) return window.RuviaAuth.canAccess(pageKey);
      return true; // fallback if guard not loaded
    }

    const notifCount = getBadge('notifications');

    // Avatar HTML
    const avatarHtml = profile?.avatar
      ? `<img src="${profile.avatar}" alt="${profile.name||user}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span style="font-size:13px;font-weight:700;color:#fff">${(user[0]||'?').toUpperCase()}</span>`;

    // Visible nav links for this role
    const visibleLinks = loggedIn
      ? NAV_LINKS.filter(l => (l.roles.length === 0 || l.roles.includes(role)) && canAccessPage(l.href))
      : [];

    // Nav items HTML
    const navItemsHtml = visibleLinks.map(l => {
      const active  = currentPage() === l.href;
      const badgeVal = l.badge ? getBadge(l.badge) : 0;
      return `
        <a href="${l.href}" class="nv-link${active ? ' active' : ''}" title="${l.label}">
          <span class="nv-icon">${l.icon}</span>
          <span class="nv-label">${l.label}</span>
          ${badgeVal > 0 ? `<span class="nv-badge">${badgeVal > 99 ? '99+' : badgeVal}</span>` : ''}
        </a>`;
    }).join('');

    placeholder.innerHTML = `
      <style>
        :root {
          --nv-h: 58px;
          --nv-bg: #ffffff;
          --nv-border: #e5e7eb;
          --nv-text: #374151;
          --nv-text2: #9ca3af;
          --nv-active-bg: #f0fdf4;
          --nv-active-color: #2c5f4a;
          --nv-hover-bg: #f9fafb;
          --nv-badge-bg: #e05c5c;
          --nv-shadow: 0 1px 0 var(--nv-border);
        }
        body.dark-mode {
          --nv-bg: #1c2030;
          --nv-border: rgba(255,255,255,.08);
          --nv-text: #e2e4ea;
          --nv-text2: #6b7280;
          --nv-active-bg: rgba(44,95,74,.18);
          --nv-active-color: #4caf87;
          --nv-hover-bg: rgba(255,255,255,.04);
          --nv-shadow: 0 1px 0 rgba(255,255,255,.05);
        }

        #ruvia-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--nv-bg);
          border-bottom: 1px solid var(--nv-border);
          box-shadow: var(--nv-shadow);
          height: var(--nv-h);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 4px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* Logo */
        .nv-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .nv-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #2c5f4a, #1a3c34);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }
        .nv-logo-text {
          font-size: 16px;
          font-weight: 800;
          color: var(--nv-text);
          letter-spacing: -.3px;
        }
        .nv-logo-sub {
          font-size: 10px;
          color: var(--nv-text2);
          font-weight: 500;
          display: none;
        }
        @media(min-width:900px){ .nv-logo-sub { display: block; } }

        /* Nav divider */
        .nv-div {
          width: 1px;
          height: 24px;
          background: var(--nv-border);
          margin: 0 8px;
          flex-shrink: 0;
        }

        /* Nav links scroll area */
        .nv-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .nv-links::-webkit-scrollbar { display: none; }

        .nv-link {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--nv-text2);
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
          transition: all .15s;
          position: relative;
          flex-shrink: 0;
        }
        .nv-link:hover { background: var(--nv-hover-bg); color: var(--nv-text); }
        .nv-link.active {
          background: var(--nv-active-bg);
          color: var(--nv-active-color);
        }
        .nv-icon { font-size: 14px; }
        .nv-label { /* show on wider screens */ }
        @media(max-width:700px){ .nv-label { display: none; } }

        /* Badge on nav link */
        .nv-badge {
          background: var(--nv-badge-bg);
          color: #fff;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          line-height: 1;
        }

        /* Right section */
        .nv-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        /* Notification bell */
        .nv-bell {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: transparent;
          border: 1.5px solid var(--nv-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all .15s;
          text-decoration: none;
          color: var(--nv-text);
        }
        .nv-bell:hover { background: var(--nv-hover-bg); border-color: #2c5f4a; }
        .nv-bell-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e05c5c;
          color: #fff;
          border-radius: 50%;
          font-size: 9px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--nv-bg);
          line-height: 1;
        }

        /* Dark mode toggle */
        .nv-dark-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: transparent;
          border: 1.5px solid var(--nv-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all .15s;
          color: var(--nv-text);
        }
        .nv-dark-btn:hover { background: var(--nv-hover-bg); border-color: #2c5f4a; }

        /* User profile pill */
        .nv-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px 5px 5px;
          border-radius: 99px;
          border: 1.5px solid var(--nv-border);
          cursor: pointer;
          transition: all .15s;
          background: transparent;
          position: relative;
          text-decoration: none;
          color: var(--nv-text);
        }
        .nv-user:hover { background: var(--nv-hover-bg); border-color: #2c5f4a; }
        .nv-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
        }
        .nv-user-info { display: none; }
        @media(min-width:640px){ .nv-user-info { display: block; } }
        .nv-username { font-size: 12px; font-weight: 700; color: var(--nv-text); line-height: 1.2; }
        .nv-userrole { font-size: 10px; color: var(--nv-text2); }

        /* User dropdown */
        .nv-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--nv-bg);
          border: 1px solid var(--nv-border);
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,.12);
          min-width: 220px;
          z-index: 2000;
          overflow: hidden;
          display: none;
        }
        .nv-dropdown.open { display: block; animation: ddOpen .15s ease; }
        @keyframes ddOpen { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .nv-dd-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--nv-border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nv-dd-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #fff;
          overflow: hidden; flex-shrink: 0;
        }
        .nv-dd-avatar img { width:100%; height:100%; object-fit:cover; }
        .nv-dd-name { font-size: 14px; font-weight: 700; color: var(--nv-text); }
        .nv-dd-role {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; margin-top: 3px;
          padding: 2px 7px; border-radius: 20px;
        }
        .nv-dd-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; font-size: 13px; font-weight: 500;
          color: var(--nv-text); text-decoration: none; cursor: pointer;
          transition: background .12s; border: none; background: transparent; width: 100%;
          text-align: left;
        }
        .nv-dd-item:hover { background: var(--nv-hover-bg); }
        .nv-dd-item.danger { color: #dc3545; }
        .nv-dd-item.danger:hover { background: #fdecea; }
        body.dark-mode .nv-dd-item.danger:hover { background: #3a1818; }
        .nv-dd-sep { height: 1px; background: var(--nv-border); margin: 4px 0; }
        .nv-login-time {
          padding: 8px 16px; font-size: 11px; color: var(--nv-text2);
          border-bottom: 1px solid var(--nv-border);
        }
      </style>

      <nav id="ruvia-navbar">
        <!-- Logo -->
        <a href="index.html" class="nv-logo">
          <div class="nv-logo-icon">🏨</div>
          <div>
            <div class="nv-logo-text">RuviaOS</div>
            <div class="nv-logo-sub">Ruvia Hotel</div>
          </div>
        </a>

        ${loggedIn ? `<div class="nv-div"></div>` : ''}

        <!-- Nav links -->
        <div class="nv-links" id="nvLinks">
          ${loggedIn ? navItemsHtml : ''}
        </div>

        <!-- Right section -->
        <div class="nv-right">
          ${loggedIn ? `
            <!-- Notification bell -->
            <a href="staff.html#notifications" class="nv-bell" id="nvBell" title="Notifications">
              🔔
              ${notifCount > 0 ? `<span class="nv-bell-badge">${notifCount > 99 ? '99+' : notifCount}</span>` : ''}
            </a>
          ` : ''}

          <!-- Dark mode toggle -->
          <button class="nv-dark-btn" id="nvDarkBtn" onclick="nvToggleDark()" title="Toggle dark mode">
            <span id="nvDarkIcon">${document.documentElement.classList.contains('dark-mode') ? '☀️' : '🌙'}</span>
          </button>

          ${loggedIn ? `
            <!-- User pill + dropdown -->
            <div style="position:relative">
              <div class="nv-user" id="nvUserPill" onclick="nvToggleDropdown()">
                <div class="nv-avatar" style="background:${meta.color}">
                  ${avatarHtml}
                </div>
                <div class="nv-user-info">
                  <div class="nv-username">${profile?.name || user}</div>
                  <div class="nv-userrole">${meta.icon} ${meta.label}</div>
                </div>
                <span style="font-size:10px;color:var(--nv-text2);margin-left:2px">▾</span>
              </div>

              <!-- Dropdown -->
              <div class="nv-dropdown" id="nvDropdown">
                <div class="nv-dd-header">
                  <div class="nv-dd-avatar" style="background:${meta.color}">
                    ${avatarHtml}
                  </div>
                  <div>
                    <div class="nv-dd-name">${profile?.name || user}</div>
                    <div class="nv-dd-role" style="background:${meta.color}22;color:${meta.color}">
                      ${meta.icon} ${meta.label}
                    </div>
                  </div>
                </div>
                ${localStorage.getItem('ruviaos_login_time') ? `
                  <div class="nv-login-time">
                    Signed in at ${new Date(localStorage.getItem('ruviaos_login_time')).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                  </div>` : ''}
                <a href="staff.html" class="nv-dd-item">👤 My Profile</a>
                ${['admin','manager'].includes(role) ? `<a href="permissions.html" class="nv-dd-item">🔐 Manage Permissions</a>` : ''}
                ${['admin','manager'].includes(role) ? `<a href="staff.html" class="nv-dd-item">👥 Staff</a>` : ''}
                <div class="nv-dd-sep"></div>
                <button class="nv-dd-item danger" onclick="nvLogout()">🚪 Sign Out</button>
              </div>
            </div>
          ` : `
            <a href="login.html" style="
              background:linear-gradient(135deg,#2c5f4a,#1a3c34);
              color:#fff; padding:8px 16px; border-radius:9px;
              font-size:13px; font-weight:600; text-decoration:none;
              transition:all .2s; display:inline-block;
            ">Sign In</a>
          `}
        </div>
      </nav>
    `;

    // ── Close dropdown on outside click ───────────────────────────────────
    document.addEventListener('click', e => {
      const pill = document.getElementById('nvUserPill');
      const dd   = document.getElementById('nvDropdown');
      if (pill && dd && !pill.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.remove('open');
      }
    });
  }

  // ── Global functions exposed to onclick ──────────────────────────────────
  window.nvToggleDropdown = function () {
    const dd = document.getElementById('nvDropdown');
    if (dd) dd.classList.toggle('open');
  };

  window.nvToggleDark = function () {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('ruvia-dark', isDark ? '1' : '0');
    const icon = document.getElementById('nvDarkIcon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  };

  window.nvLogout = function () {
    if (window.RuviaAuth) {
      window.RuviaAuth.logout();
    } else {
      // Fallback if guard not loaded
      try {
        const u    = localStorage.getItem('ruviaos_user') || '';
        const role = localStorage.getItem('ruviaos_role') || '';
        const log  = JSON.parse(localStorage.getItem('ruvia_attendance') || '[]');
        log.push({ username:u, role, event:'logout', time:new Date().toISOString(), date:new Date().toISOString().slice(0,10) });
        localStorage.setItem('ruvia_attendance', JSON.stringify(log));
      } catch (e) {}
      localStorage.removeItem('ruviaos_logged_in');
      localStorage.removeItem('ruviaos_user');
      localStorage.removeItem('ruviaos_role');
      localStorage.removeItem('ruviaos_login_time');
      window.location.href = 'login.html';
    }
  };

  // ── Auto-refresh badge counts every 30s ────────────────────────────────
  function refreshBadges() {
    // Refresh notification bell badge
    const bell = document.getElementById('nvBell');
    if (!bell) return;
    const n = getBadge('notifications');
    let badge = bell.querySelector('.nv-bell-badge');
    if (n > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nv-bell-badge';
        bell.appendChild(badge);
      }
      badge.textContent = n > 99 ? '99+' : n;
    } else if (badge) {
      badge.remove();
    }

    // Refresh individual nav link badges
    const visibleLinks = NAV_LINKS.filter(l => l.badge);
    visibleLinks.forEach(l => {
      const link = document.querySelector(`#nvLinks a[href="${l.href}"]`);
      if (!link) return;
      const val = getBadge(l.badge);
      let b = link.querySelector('.nv-badge');
      if (val > 0) {
        if (!b) { b = document.createElement('span'); b.className = 'nv-badge'; link.appendChild(b); }
        b.textContent = val > 99 ? '99+' : val;
      } else if (b) {
        b.remove();
      }
    });
  }

  // ── Build on DOM ready ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { build(); setInterval(refreshBadges, 30000); });
  } else {
    build();
    setInterval(refreshBadges, 30000);
  }

  // Re-build when storage changes (e.g. new notification arrives in another tab)
  window.addEventListener('storage', e => {
    if (['ruvia_notifications', 'ruviaos_logged_in', 'ruvia_rooms', 'ruvia_reservations'].includes(e.key)) {
      refreshBadges();
    }
  });

})();
