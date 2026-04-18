// RuviaOS – Self-injecting navbar (works on file:// and http://)
(function(){
  var NAV_HTML = `
<style>
.ruvia-navbar{background:linear-gradient(135deg,#1a3c34,#2c5f4a);color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-radius:12px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.12);font-family:'Segoe UI',sans-serif}
.navbar-logo{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:700;text-decoration:none;color:#fff}
.navbar-logo span{font-size:26px}
.navbar-menu{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.nav-link{color:#fff;text-decoration:none;padding:7px 13px;border-radius:7px;transition:all .2s;font-size:13px;white-space:nowrap}
.nav-link:hover{background:rgba(255,255,255,.18)}
.nav-link.active-page{background:rgba(255,255,255,.28);font-weight:600}
#ruviaNavLinks{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.login-nav-btn{background:#ffc107;color:#333;border:none;border-radius:7px;padding:7px 16px;cursor:pointer;font-size:13px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.login-nav-btn:hover{background:#e0a800}
.logout-nav-btn{background:#dc3545;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer;font-size:13px;font-weight:700}
.logout-nav-btn:hover{background:#c82333}
.user-info{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);padding:5px 14px;border-radius:24px}
.user-avatar{width:28px;height:28px;background:#ffc107;color:#333;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.darkmode-nav-btn{background:rgba(255,255,255,.2);border:none;border-radius:7px;padding:7px 13px;cursor:pointer;font-size:13px;color:#fff;white-space:nowrap}
.darkmode-nav-btn:hover{background:rgba(255,255,255,.3)}
@media(max-width:700px){.ruvia-navbar{flex-direction:column;border-radius:10px}.navbar-menu{justify-content:center;width:100%}}
</style>
<div class="ruvia-navbar">
  <a href="index.html" class="navbar-logo"><span>🏨</span>RuviaOS</a>
  <div class="navbar-menu">
    <div id="ruviaNavLinks" style="display:none">
      <a href="frontdesk.html" class="nav-link">🏨 Reception</a>
      <a href="pms.html" class="nav-link">📅 PMS</a>
      <a href="pos.html" class="nav-link">🍽️ POS</a>
      <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
      <a href="housekeeping.html" class="nav-link">🧹 Housekeeping</a>
      <a href="tables.html" class="nav-link">🪑 Tables</a>
      <a href="stock.html" class="nav-link">📦 Stock</a>
      <a href="menu-management.html" class="nav-link">📋 Menu</a>
      <a href="reports.html" class="nav-link">📄 Reports</a>
      <a href="staff.html" class="nav-link">👥 Staff</a>
    </div>
    <button class="darkmode-nav-btn" id="ruviaDarkBtn">🌙 Dark</button>
    <div id="ruviaAuthSection"><a href="login.html" class="login-nav-btn">🔐 Login</a></div>
  </div>
</div>`;

  // Inject into placeholder or prepend to body
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
    // Auth state
    var loggedIn = localStorage.getItem('ruviaos_logged_in') === 'true';
    var user = localStorage.getItem('ruviaos_user') || '';
    var nl = document.getElementById('ruviaNavLinks');
    var auth = document.getElementById('ruviaAuthSection');

    if(loggedIn && user){
      if(nl) nl.style.display = 'flex';
      if(auth) auth.innerHTML =
        '<div class="user-info"><div class="user-avatar">' + user.charAt(0).toUpperCase() + '</div>' +
        '<span style="font-size:13px">' + user + '</span></div>' +
        '<button class="logout-nav-btn" onclick="ruviaLogout()">🚪 Logout</button>';
    } else {
      if(nl) nl.style.display = 'none';
      if(auth) auth.innerHTML = '<a href="login.html" class="login-nav-btn">🔐 Login</a>';
    }

    // Highlight active page
    var cur = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function(a){
      a.classList.toggle('active-page', a.getAttribute('href') === cur);
    });

    // Dark mode button
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
