// RuviaOS – Self-injecting navbar (works on file:// and http://)
(function(){
  // Inject dependencies (Fonts & Icons)
  if(!document.getElementById('ruvia-deps')){
    var head = document.head;
    var deps = document.createElement('div');
    deps.id = 'ruvia-deps';
    deps.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
      <script src="https://unpkg.com/@phosphor-icons/web"></script>
    `;
    while(deps.firstChild) head.appendChild(deps.firstChild);
  }

  var NAV_HTML = `
<style>
.ruvia-navbar{background:rgba(26,60,52,0.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-radius:20px;margin:20px auto;max-width:1360px;box-shadow:0 8px 32px rgba(0,0,0,0.2);font-family:'Inter',sans-serif;border:1px solid rgba(255,255,255,0.1);position:sticky;top:20px;z-index:1000}
.navbar-logo{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:800;text-decoration:none;color:#fff;font-family:'Montserrat',sans-serif;letter-spacing:-0.03em}
.navbar-logo i{font-size:28px;color:#c5a059}
.navbar-menu{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.nav-link{color:rgba(255,255,255,0.8);text-decoration:none;padding:8px 14px;border-radius:10px;transition:all 0.3s ease;font-size:14px;font-weight:500;white-space:nowrap;display:flex;align-items:center;gap:6px}
.nav-link i{font-size:18px;opacity:0.7}
.nav-link:hover{background:rgba(255,255,255,0.1);color:#fff}
.nav-link.active-page{background:#c5a059;color:#1a3c34;font-weight:700;box-shadow:0 4px 12px rgba(197,160,89,0.3)}
.nav-link.active-page i{opacity:1}
#ruviaNavLinks{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.login-nav-btn{background:#c5a059;color:#1a3c34;border:none;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:14px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all 0.3s}
.login-nav-btn:hover{background:#d4b476;transform:translateY(-2px)}
.logout-nav-btn{background:rgba(220,53,69,0.2);color:#ff7675;border:1px solid rgba(220,53,69,0.2);border-radius:10px;padding:9px 18px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.3s}
.logout-nav-btn:hover{background:#dc3545;color:#fff}
.user-info{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.1);padding:6px 16px;border-radius:30px;border:1px solid rgba(255,255,255,0.05)}
.user-avatar{width:28px;height:28px;background:#c5a059;color:#1a3c34;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.darkmode-nav-btn{background:rgba(255,255,255,0.1);border:none;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:14px;color:#fff;white-space:nowrap;transition:all 0.3s}
.darkmode-nav-btn:hover{background:rgba(255,255,255,0.2)}
@media(max-width:1100px){.ruvia-navbar{margin:10px;border-radius:15px;padding:10px 15px}.navbar-logo{font-size:18px}#ruviaNavLinks{display:none!important}}
</style>
<div class="ruvia-navbar">
  <a href="index.html" class="navbar-logo"><i class="ph-fill ph-buildings"></i>RuviaOS</a>
  <div class="navbar-menu">
    <div id="ruviaNavLinks" style="display:none">
      <a href="frontdesk.html" class="nav-link"><i class="ph ph-desktop"></i> Reception</a>
      <a href="pms.html" class="nav-link"><i class="ph ph-calendar-check"></i> PMS</a>
      <a href="pos.html" class="nav-link"><i class="ph ph-cooking-pot"></i> POS</a>
      <a href="dashboard.html" class="nav-link"><i class="ph ph-gauge"></i> Dashboard</a>
      <a href="housekeeping.html" class="nav-link"><i class="ph ph-broom"></i> Housekeeping</a>
      <a href="stock.html" class="nav-link"><i class="ph ph-package"></i> Stock</a>
      <a href="reports.html" class="nav-link"><i class="ph ph-chart-pie"></i> Reports</a>
    </div>
    <button class="darkmode-nav-btn" id="ruviaDarkBtn"><i class="ph ph-moon"></i> Dark</button>
    <div id="ruviaAuthSection"><a href="login.html" class="login-nav-btn"><i class="ph-bold ph-lock-key"></i> Login</a></div>
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
    var userRaw = localStorage.getItem('ruviaos_user') || '';
    var userName = 'Admin';

    try {
      if(userRaw.startsWith('{')) {
        var uObj = JSON.parse(userRaw);
        userName = uObj.username || uObj.name || 'Admin';
      } else {
        userName = userRaw || 'Admin';
      }
    } catch(e) { userName = userRaw || 'Admin'; }

    var nl = document.getElementById('ruviaNavLinks');
    var auth = document.getElementById('ruviaAuthSection');

    if(loggedIn){
      if(nl) nl.style.display = 'flex';
      if(auth) auth.innerHTML =
        '<div class="user-info"><div class="user-avatar">' + userName.charAt(0).toUpperCase() + '</div>' +
        '<span style="font-size:14px; font-weight:600">' + userName + '</span></div>' +
        '<button class="logout-nav-btn" onclick="ruviaLogout()">Logout</button>';
    } else {
      if(nl) nl.style.display = 'none';
      if(auth) auth.innerHTML = '<a href="login.html" class="login-nav-btn"><i class="ph-bold ph-lock-key"></i> Login</a>';
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
      btn.innerHTML = isDark ? '<i class="ph ph-sun"></i> Light' : '<i class="ph ph-moon"></i> Dark';
      btn.onclick = function(){
        var on = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', on);
        localStorage.setItem('ruvia-dark', on ? '1' : '0');
        btn.innerHTML = on ? '<i class="ph ph-sun"></i> Light' : '<i class="ph ph-moon"></i> Dark';
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
