/**
 * RuviaOS — Activity Status Bar
 * Add to any page: <div id="ruvia-statusbar"></div><script src="ruvia-statusbar.js"></script>
 */
(function () {

  const ICONS = {
    login: '🔐', logout: '🚪', checkin: '✅', checkout: '👋',
    sale: '💰', stock: '📦', booking: '📅', notification: '🔔',
    housekeeping: '🧹', payment: '💳', auth: '🔐', general: '📋'
  };

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function render(containerId) {
    const container = document.getElementById(containerId || 'ruvia-statusbar');
    if (!container) return;
    const log = window.RuviaActivity ? RuviaActivity.getRecent(30) : [];

    if (!log.length) {
      container.innerHTML = `<div class="rsb-empty">No activity yet today</div>`;
      return;
    }

    container.innerHTML = log.map(entry => `
      <div class="rsb-item">
        <span class="rsb-icon">${ICONS[entry.type] || ICONS[entry.category] || '📋'}</span>
        <div class="rsb-content">
          <span class="rsb-msg">${entry.message}</span>
          <span class="rsb-who">${entry.username}</span>
        </div>
        <span class="rsb-time">${timeAgo(entry.time)}</span>
      </div>`).join('');
  }

  function init(containerId) {
    const id = containerId || 'ruvia-statusbar';
    const container = document.getElementById(id);
    if (!container) return;

    const style = document.createElement('style');
    style.textContent = `
      #${id}{max-height:320px;overflow-y:auto;scrollbar-width:thin}
      .rsb-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border,#f0f0f0);transition:background .15s;font-size:12px}
      .rsb-item:hover{background:var(--row-hover,#f8f9fa)}
      .rsb-item:last-child{border-bottom:none}
      .rsb-icon{font-size:14px;flex-shrink:0;width:20px;text-align:center;line-height:1}
      .rsb-content{flex:1;min-width:0}
      .rsb-msg{color:var(--text,#222);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rsb-who{color:var(--text2,#888);font-size:11px;margin-top:1px;display:block}
      .rsb-time{color:var(--text2,#aaa);font-size:10px;flex-shrink:0;white-space:nowrap;margin-left:6px}
      .rsb-empty{padding:20px;text-align:center;color:var(--text2,#999);font-size:12px;font-style:italic}
    `;
    document.head.appendChild(style);

    render(id);

    // Live update every 10s
    setInterval(() => render(id), 10000);

    // Cross-tab live update
    window.addEventListener('storage', e => {
      if (e.key === 'ruvia_activity_log') render(id);
    });
  }

  window.RuviaStatusBar = { init, render };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ruvia-statusbar')) init('ruvia-statusbar');
  });

})();
