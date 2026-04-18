// RuviaOS – Modern Navbar (Indigo & Slate)
(function(){
  var NAV_HTML = `
<style>
.ruvia-navbar {
  background: var(--header-gradient, linear-gradient(135deg, #4f46e5, #4338ca));
  color: #fff;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-radius: var(--radius, 12px);
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  text-decoration: none;
  color: #fff;
  letter-spacing: -0.025em;
}
.navbar-logo span { font-size: 1.5rem; }
.navbar-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.nav-link.active-page {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 600;
}
#ruviaNavLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}
.login-nav-btn {
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.login-nav-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}
.logout-nav-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s;
}
.logout-nav-btn:hover { background: #dc2626; }
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.375rem 1rem 0.375rem 0.375rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.user-avatar {
  width: 2rem;
  height: 2rem;
  background: #f59e0b;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.darkmode-nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #fff;
  white-space: nowrap;
  transition: all 0.2s;
}
.darkmode-nav-btn:hover { background: rgba(255, 255, 255, 0.2); }
@media(max-width:800px) {
  .ruvia-navbar { flex-direction: column; align-items: flex-start; padding: 1rem; }
  .navbar-menu { width: 100%; justify-content: space-between; }
  #ruviaNavLinks { order: 3; width: 100%; justify-content: center; margin-top: 0.5rem; }
}
</style>
<div class="ruvia-navbar">
  <a href="index.html" class="navbar-logo"><span>🏨</span>RuviaOS</a>
  <div class="navbar-menu">
    <div id="ruviaNavLinks" style="display:none">
      <a href="frontdesk.html" class="nav-link">Reception</a>
      <a href="pms.html" class="nav-link">PMS</a>
      <a href="pos.html" class="nav-link">POS</a>
      <a href="dashboard.html" class="nav-link">Dashboard</a>
      <a href="housekeeping.html" class="nav-link">Housekeeping</a>
      <a href="tables.html" class="nav-link">Tables</a>
      <a href="stock.html" class="nav-link">Stock</a>
      <a href="menu-management.html" class="nav-link">Menu</a>
      <a href="reports.html" class="nav-link">Reports</a>
      <a href="staff.html" class="nav-link">Staff</a>
    </div>
    <div style="display:flex; gap:0.5rem; align-items:center">
      <button class="darkmode-nav-btn" id="ruviaDarkBtn">🌙 Dark</button>
      <div id="ruviaAuthSection"><a href="login.html" class="login-nav-btn">🔐 Login</a></div>
    </div>
  </div>
</div>`;

  function inject(){
    var ph = document.getElementById('navbar-placeholder');
    if(ph){ ph.innerHTML = NAV_HTML; }
    else {
      var d = document.createElement('div');
      d.innerHTML = NAV_HTML;
      document.body.insertBefore(d.firstChild, document.body.firstChild);
    }
    initNav();
  }

  function initNav(){
    var loggedIn = localStorage.getItem('ruviaos_logged_in') === 'true';
    var user = localStorage.getItem('ruviaos_user') || '';
    var nl = document.getElementById('ruviaNavLinks');
    var auth = document.getElementById('ruviaAuthSection');

    if(loggedIn && user){
      if(nl) nl.style.display = 'flex';
      if(auth) auth.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem">
          <div class="user-info">
            <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
            <span style="font-size:0.875rem; font-weight:500">${user}</span>
          </div>
          <button class="logout-nav-btn" onclick="ruviaLogout()">Logout</button>
        </div>`;
    } else {
      if(nl) nl.style.display = 'none';
      if(auth) auth.innerHTML = '<a href="login.html" class="login-nav-btn">🔐 Login</a>';
    }

    var cur = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function(a){
      a.classList.toggle('active-page', a.getAttribute('href') === cur);
    });

    var btn = document.getElementById('ruviaDarkBtn');
    if(btn){
      var isDark = document.body.classList.contains('dark-mode');
      btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
      btn.onclick = function(){
        var on = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', on);
        localStorage.setItem('ruvia-dark', on ? '1' : '0');
        btn.innerHTML = on ? '☀️ Light' : '🌙 Dark';
      };
    }
  }

  window.ruviaLogout = function(){
    ['ruviaos_logged_in','ruviaos_user','ruviaos_role'].forEach(function(k){ localStorage.removeItem(k); });
    window.location.href = 'index.html';
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
