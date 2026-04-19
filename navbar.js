/**
 * RuviaOS Navbar v3 — Full-width sticky, notification badges, RBAC, profile
 * MUST be placed as direct child of <body>, outside any max-width containers
 */
(function(){
'use strict';

const PAGE_META = {
  frontdesk:       { icon:'🏨', label:'Front Desk',   badge:'arrivals' },
  pms:             { icon:'📅', label:'Reservations', badge:'res' },
  pos:             { icon:'🍽', label:'POS',           badge:null },
  dashboard:       { icon:'📊', label:'Dashboard',    badge:null },
  housekeeping:    { icon:'🧹', label:'Housekeeping', badge:'dirty' },
  tables:          { icon:'🪑', label:'Tables',        badge:null },
  stock:           { icon:'📦', label:'Stock',         badge:'stock' },
  'menu-management':{ icon:'📋', label:'Menu',          badge:null },
  reports:         { icon:'📈', label:'Reports',       badge:null },
  staff:           { icon:'👥', label:'Staff',         badge:null },
};

const ROLE_NAV = {
  admin:       Object.keys(PAGE_META),
  manager:     ['frontdesk','pms','pos','dashboard','housekeeping','tables','stock','menu-management','reports','staff'],
  reception:   ['frontdesk','pms'],
  kitchen:     ['pos','stock','menu-management','tables'],
  housekeeping:['housekeeping'],
};

const ROLE_LABELS = {
  admin:'Administrator', manager:'Manager', reception:'Receptionist',
  kitchen:'Kitchen Staff', housekeeping:'Housekeeping'
};

const ROLE_COLORS = {
  admin:'#dc3545', manager:'#e0a800', reception:'#17a2b8',
  kitchen:'#28a745', housekeeping:'#6c757d'
};

function getBadge(type){
  if(!window.RuviaStore) return 0;
  try{
    const today=new Date().toISOString().slice(0,10);
    if(type==='arrivals') return RuviaStore.getReservations().filter(r=>r.status==='confirmed'&&r.check_in<=today).length;
    if(type==='dirty')    return RuviaStore.getRooms().filter(r=>r.status==='dirty'||r.status==='cleaning').length;
    if(type==='stock')    return RuviaStore.getProducts().filter(p=>p.current_stock<=p.reorder_level).length;
  }catch(e){}
  return 0;
}

function initials(name){ return (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

function timeAgo(iso){
  const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000);
  if(m<1) return 'just now'; if(m<60) return m+'m ago';
  const h=Math.floor(m/60); if(h<24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}

function renderNotifs(user){
  const list=document.getElementById('rn-list'); if(!list) return;
  const notifs=window.RuviaNotifications?RuviaNotifications.getForUser(user).slice(0,20):[];
  if(!notifs.length){list.innerHTML='<div style="padding:24px;text-align:center;font-size:12px;color:var(--text2,#9a9da8)">No notifications</div>';return;}
  list.innerHTML=notifs.map(n=>{
    const t=new Date(n.time),today=new Date().toDateString()===t.toDateString();
    const ts=today?t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):t.toLocaleDateString();
    return`<div class="rn-item${n.read?'':' unread'}" onclick="window._rnavReadNotif(${n.id},'${n.link||''}')">
      <div class="rn-title">${n.title}</div>
      <div class="rn-body">${n.body}</div>
      <div class="rn-ts">${ts}</div>
    </div>`;
  }).join('');
}

function build(){
  const li=localStorage.getItem('ruviaos_logged_in')==='true';
  const user=localStorage.getItem('ruviaos_user')||'';
  const role=localStorage.getItem('ruviaos_role')||'reception';
  const navKeys=ROLE_NAV[role]||ROLE_NAV.reception;
  const cur=location.pathname.split('/').pop().replace('.html','')||'index';
  const isDark=document.body.classList.contains('dark-mode');
  const notifCount=li&&window.RuviaNotifications?RuviaNotifications.getUnreadCount(user):0;

  // Login time
  let loginTime='';
  try{
    const att=JSON.parse(localStorage.getItem('ruvia_attendance')||'[]');
    const today=new Date().toISOString().slice(0,10);
    const tl=att.filter(r=>r.username===user&&r.date===today&&r.event==='login');
    if(tl.length) loginTime=new Date(tl[0].time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }catch(e){}

  const navLinks=li?navKeys.map(key=>{
    const m=PAGE_META[key]; if(!m) return '';
    const active=cur===key;
    const b=m.badge?getBadge(m.badge):0;
    return`<a href="${key}.html" class="rn-link${active?' active':''}" title="${m.label}">
      <span class="rn-link-icon">${m.icon}</span>
      <span class="rn-link-lbl">${m.label}</span>
      ${b>0?`<span class="rn-badge">${b}</span>`:''}
    </a>`;
  }).join(''):'';

  const html=`<style>
.rn{background:#1a3c34;color:#fff;height:56px;display:flex;align-items:center;padding:0 20px;gap:0;position:sticky;top:0;z-index:9999;box-shadow:0 2px 12px rgba(0,0,0,.3);width:100%;box-sizing:border-box}
.rn-logo{display:flex;align-items:center;gap:9px;text-decoration:none;color:#fff;font-size:16px;font-weight:700;flex-shrink:0;margin-right:8px}
.rn-logo-icon{width:32px;height:32px;background:rgba(255,255,255,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;border:1px solid rgba(255,255,255,.2)}
.rn-links{display:flex;align-items:center;gap:1px;flex:1;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.rn-links::-webkit-scrollbar{display:none}
.rn-link{display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;text-decoration:none;color:rgba(255,255,255,.72);font-size:12px;white-space:nowrap;transition:all .15s;position:relative;flex-shrink:0;height:38px}
.rn-link:hover,.rn-link.active{background:rgba(255,255,255,.16);color:#fff}
.rn-link.active{background:rgba(255,255,255,.22)}
.rn-link-icon{font-size:14px;line-height:1;width:16px;text-align:center}
.rn-link-lbl{display:none}
@media(min-width:1120px){.rn-link-lbl{display:inline}}
.rn-badge{position:absolute;top:3px;right:2px;background:#e05c5c;color:#fff;border-radius:20px;font-size:9px;font-weight:700;min-width:14px;height:14px;display:flex;align-items:center;justify-content:center;padding:0 3px;line-height:1}
.rn-right{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px}
.rn-icon-btn{width:36px;height:36px;background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;transition:background .15s;flex-shrink:0}
.rn-icon-btn:hover{background:rgba(255,255,255,.22)}
.rn-notif-dot{position:absolute;top:-1px;right:-1px;background:#e05c5c;border-radius:50%;width:14px;height:14px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #1a3c34;line-height:1;color:#fff}
.rn-dark-btn{background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:9px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:500;white-space:nowrap;transition:background .15s;height:36px}
.rn-dark-btn:hover{background:rgba(255,255,255,.22)}
.rn-profile{display:flex;align-items:center;gap:8px;cursor:pointer;padding:5px 10px;border-radius:9px;transition:background .15s;position:relative;height:44px}
.rn-profile:hover{background:rgba(255,255,255,.12)}
.rn-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,.3)}
.rn-uinfo{display:none;line-height:1.25}
@media(min-width:860px){.rn-uinfo{display:block}}
.rn-uname{font-size:12px;font-weight:600;color:#fff}
.rn-urole{font-size:10px;color:rgba(255,255,255,.6)}
/* Dropdowns */
.rn-dropdown,.rn-notif-panel{position:absolute;top:calc(100% + 6px);right:0;background:var(--card,#fff);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:none;z-index:10000;min-width:210px;border:1px solid var(--border,rgba(0,0,0,.1));overflow:hidden}
.rn-dropdown.open,.rn-notif-panel.open{display:block}
.rn-dd-head{padding:14px 16px;background:var(--th-bg,#f8f9fa);border-bottom:1px solid var(--border,#eee)}
.rn-dd-name{font-size:13px;font-weight:600;color:var(--text,#222)}
.rn-dd-role{font-size:11px;color:var(--text2,#666);margin-top:2px}
.rn-dd-login{font-size:10px;color:var(--text2,#aaa);margin-top:3px}
.rn-dd-item{padding:10px 16px;font-size:13px;color:var(--text,#333);cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border,#f0f0f0);transition:background .1s}
.rn-dd-item:last-child{border-bottom:none}
.rn-dd-item:hover{background:var(--row-hover,#f5f5f5)}
.rn-dd-item.danger{color:#dc3545}
.rn-notif-panel{min-width:300px;max-height:380px;display:none;flex-direction:column}
.rn-notif-panel.open{display:flex}
.rn-notif-head{padding:12px 16px;font-size:13px;font-weight:600;color:var(--text,#222);border-bottom:1px solid var(--border,#eee);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:var(--th-bg,#f8f9fa)}
.rn-notif-clr{font-size:11px;color:var(--accent,#2c5f4a);cursor:pointer;font-weight:400}
.rn-notif-body{overflow-y:auto;flex:1}
.rn-item{padding:11px 16px;border-bottom:1px solid var(--border,#f0f0f0);cursor:pointer;transition:background .1s}
.rn-item:last-child{border-bottom:none}
.rn-item:hover{background:var(--row-hover,#f9f9f9)}
.rn-item.unread{background:var(--accent-light,#e8f5e9)}
.rn-title{font-size:12px;font-weight:600;color:var(--text,#222)}
.rn-body{font-size:11px;color:var(--text2,#666);margin-top:2px}
.rn-ts{font-size:10px;color:var(--text2,#aaa);margin-top:3px}
</style>

<div class="rn" id="rn">
  <a href="index.html" class="rn-logo">
    <div class="rn-logo-icon">🏨</div>
    <span>RuviaOS</span>
  </a>
  <div class="rn-links">${navLinks}</div>
  <div class="rn-right">
    <button class="rn-dark-btn" onclick="rn_toggleDark()" id="rnDarkBtn">${isDark?'☀ Light':'🌙 Dark'}</button>
    ${li?`
    <div style="position:relative">
      <button class="rn-icon-btn" onclick="rn_toggleNotif()" title="Notifications">
        🔔
        ${notifCount>0?`<span class="rn-notif-dot">${notifCount}</span>`:''}
      </button>
      <div class="rn-notif-panel" id="rn-notif-panel">
        <div class="rn-notif-head"><span>Notifications</span><span class="rn-notif-clr" onclick="rn_clearNotifs()">Mark all read</span></div>
        <div class="rn-notif-body" id="rn-list"></div>
      </div>
    </div>
    <div class="rn-profile" onclick="rn_toggleDD()" id="rn-profile-btn">
      <div class="rn-avatar" style="background:${ROLE_COLORS[role]||'#2c5f4a'}">${initials(user)}</div>
      <div class="rn-uinfo">
        <div class="rn-uname">${user}</div>
        <div class="rn-urole">${ROLE_LABELS[role]||role}</div>
      </div>
      <div class="rn-dropdown" id="rn-dd">
        <div class="rn-dd-head">
          <div class="rn-dd-name">${user}</div>
          <div class="rn-dd-role">${ROLE_LABELS[role]||role}</div>
          ${loginTime?`<div class="rn-dd-login">Today's login: ${loginTime}</div>`:''}
        </div>
        <div class="rn-dd-item" onclick="location.href='staff.html'">👤 My Profile</div>
        <div class="rn-dd-item" onclick="rn_toggleDark()">🌙 Toggle Dark Mode</div>
        ${['admin','manager'].includes(role)?`<div class="rn-dd-item" onclick="location.href='staff.html'">⚙ Manage Staff</div>`:''}
        ${role==='admin'?`<div class="rn-dd-item" onclick="location.href='backup-dashboard.html'">💾 Backup</div>`:''}
        <div class="rn-dd-item danger" onclick="rn_logout()">🚪 Sign Out</div>
      </div>
    </div>
    `:` <a href="login.html" style="background:#ffc107;color:#1a1a2e;padding:8px 16px;border-radius:9px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap">🔐 Login</a>`}
  </div>
</div>`;

  const ph=document.getElementById('navbar-placeholder');
  if(ph){ ph.innerHTML=html; ph.style.cssText='display:block;width:100%;margin:0;padding:0'; }
  else{ const d=document.createElement('div');d.style.cssText='display:block;width:100%;margin:0;padding:0;';d.innerHTML=html;document.body.insertBefore(d,document.body.firstChild); }

  if(li) renderNotifs(user);

  // OTP click-outside
  document.addEventListener('click',e=>{
    if(!e.target.closest('#rn-profile-btn')) document.getElementById('rn-dd')?.classList.remove('open');
    if(!e.target.closest('.rn-icon-btn')&&!e.target.closest('#rn-notif-panel')) document.getElementById('rn-notif-panel')?.classList.remove('open');
  });
}

// Global handlers
window.rn_toggleDD=()=>{document.getElementById('rn-dd')?.classList.toggle('open');document.getElementById('rn-notif-panel')?.classList.remove('open');};
window.rn_toggleNotif=()=>{
  document.getElementById('rn-notif-panel')?.classList.toggle('open');
  document.getElementById('rn-dd')?.classList.remove('open');
  const u=localStorage.getItem('ruviaos_user');
  renderNotifs(u);
};
window.rn_clearNotifs=()=>{
  const u=localStorage.getItem('ruviaos_user');
  if(window.RuviaNotifications) RuviaNotifications.markAllRead(u);
  renderNotifs(u);
  document.querySelectorAll('.rn-notif-dot').forEach(b=>b.remove());
};
window._rnavReadNotif=(id,link)=>{
  if(window.RuviaNotifications) RuviaNotifications.markRead(id);
  document.getElementById('rn-notif-panel')?.classList.remove('open');
  if(link) location.href=link;
};
window.rn_logout=()=>{
  try{
    const u=localStorage.getItem('ruviaos_user');
    const al=JSON.parse(localStorage.getItem('ruvia_activity_log')||'[]');
    al.unshift({id:Date.now(),type:'logout',message:u+' signed out',username:u,category:'auth',time:new Date().toISOString()});
    localStorage.setItem('ruvia_activity_log',JSON.stringify(al.slice(0,500)));
    const att=JSON.parse(localStorage.getItem('ruvia_attendance')||'[]');
    att.push({username:u,event:'logout',time:new Date().toISOString(),date:new Date().toISOString().slice(0,10)});
    localStorage.setItem('ruvia_attendance',JSON.stringify(att));
  }catch(e){}
  ['ruviaos_logged_in','ruviaos_user','ruviaos_role'].forEach(k=>localStorage.removeItem(k));
  location.href='login.html';
};
window.rn_toggleDark=function(){
  const on=!document.body.classList.contains('dark-mode');
  document.body.classList.toggle('dark-mode',on);
  localStorage.setItem('ruvia-dark',on?'1':'0');
  document.querySelectorAll('#rnDarkBtn,.rn-dark-btn,.ruvia-dark-btn,.darkmode-nav-btn').forEach(b=>b.textContent=on?'☀ Light':'🌙 Dark');
  document.querySelectorAll('#darkModeToggleBtn').forEach(b=>b.innerHTML=on?'☀️ Light':'🌙 Dark');
};
// Also keep window.toggleDarkMode pointing same function
window.toggleDarkMode=window.rn_toggleDark;

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build);
else build();

// Apply saved dark mode
(function(){
  const s=localStorage.getItem('ruvia-dark'),p=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches;
  if(s==='1'||(s===null&&p)) document.body.classList.add('dark-mode');
})();

})();
