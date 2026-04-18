/**
 * RuviaOS — Menu Print & QR Code
 * Usage: RuviaMenuPrint.show() / RuviaMenuPrint.printMenu()
 */
(function () {

  // QR Code using Google Charts API (no external library needed)
  function qrURL(text) {
    return `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8`;
  }

  function getProducts() {
    if (window.RuviaStore) return RuviaStore.getProducts();
    return [];
  }

  function groupByCategory(products) {
    const groups = {};
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }

  const CAT_LABELS = {
    breakfast:'🍳 Breakfast', maincourse:'🍽 Main Course', food:'🍽 Food',
    snacks:'🍔 Snacks', beverages:'🥤 Beverages', beverage:'🥤 Beverages',
    spa:'💆 Spa', other:'📦 Other'
  };

  function buildMenuHTML(forPrint) {
    const products = getProducts().filter(p => p.current_stock > 0 || !forPrint);
    const groups = groupByCategory(products);
    const cfg = window.RuviaReceipt ? RuviaReceipt.getConfig() : { hotelName:'Ruvia Hotel', phone:'' };

    const groupsHTML = Object.entries(groups).map(([cat, items]) => `
      <div class="menu-section">
        <h3 class="menu-cat">${CAT_LABELS[cat] || cat}</h3>
        <div class="menu-items">
          ${items.map(p => `
            <div class="menu-item ${p.current_stock === 0 ? 'unavailable' : ''}">
              <div class="menu-item-left">
                <span class="menu-emoji">${p.emoji || '🍴'}</span>
                <div>
                  <div class="menu-name">${p.name}${p.current_stock === 0 ? ' <span class="unavail-tag">Unavailable</span>' : ''}</div>
                  ${p.description ? `<div class="menu-desc">${p.description}</div>` : ''}
                </div>
              </div>
              <div class="menu-price">USh ${Math.round(p.unit_price || 0).toLocaleString()}</div>
            </div>`).join('')}
        </div>
      </div>`).join('');

    return `
      <div class="menu-wrap">
        <div class="menu-header">
          <div class="menu-title">${cfg.hotelName}</div>
          <div class="menu-subtitle">Restaurant Menu</div>
          ${cfg.phone ? `<div class="menu-contact">${cfg.phone}</div>` : ''}
        </div>
        ${groupsHTML}
        <div class="menu-footer">Prices include VAT · Minimum service charge applies</div>
      </div>`;
  }

  function show() {
    if (document.getElementById('ruviaMenuOverlay')) document.getElementById('ruviaMenuOverlay').remove();

    const menuHTML = buildMenuHTML(false);
    const menuURL = window.location.href.replace('menu-management.html', 'menu-management.html') + '?view=menu';

    const overlay = document.createElement('div');
    overlay.id = 'ruviaMenuOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <style>
      .menu-modal{background:#fff;border-radius:14px;max-width:700px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
      .menu-modal-hdr{padding:14px 20px;background:#1a3c34;color:#fff;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
      .menu-modal-hdr h3{font-size:15px;font-weight:600}
      .menu-actions{display:flex;gap:8px;padding:12px 20px;background:#f8f9fa;border-bottom:1px solid #eee;flex-shrink:0}
      .menu-btn{padding:8px 16px;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer}
      .menu-body{padding:20px;overflow-y:auto;flex:1;display:flex;gap:20px;align-items:flex-start}
      .menu-preview{flex:1}
      .menu-qr{flex-shrink:0;text-align:center;background:#f8f9fa;border-radius:10px;padding:16px}
      .menu-qr-title{font-size:12px;font-weight:600;color:#555;margin-bottom:8px}
      .menu-qr img{width:150px;height:150px;border-radius:6px}
      .menu-qr-sub{font-size:10px;color:#999;margin-top:6px}
      .menu-wrap{font-family:'Georgia',serif}
      .menu-header{text-align:center;margin-bottom:24px;border-bottom:2px solid #2c5f4a;padding-bottom:16px}
      .menu-title{font-size:26px;font-weight:700;color:#1a3c34;margin-bottom:4px}
      .menu-subtitle{font-size:14px;color:#666;text-transform:uppercase;letter-spacing:.1em}
      .menu-contact{font-size:12px;color:#888;margin-top:4px}
      .menu-section{margin-bottom:20px}
      .menu-cat{font-size:15px;font-weight:700;color:#2c5f4a;padding:6px 0;border-bottom:1px solid #e0e0e0;margin-bottom:10px}
      .menu-items{display:flex;flex-direction:column;gap:8px}
      .menu-item{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:8px 0}
      .menu-item.unavailable{opacity:.5}
      .menu-item-left{display:flex;gap:10px;align-items:flex-start;flex:1}
      .menu-emoji{font-size:22px;flex-shrink:0;line-height:1;margin-top:1px}
      .menu-name{font-size:13px;font-weight:600;color:#222}
      .menu-desc{font-size:11px;color:#888;margin-top:2px;font-style:italic}
      .menu-price{font-size:13px;font-weight:700;color:#2c5f4a;white-space:nowrap;flex-shrink:0}
      .unavail-tag{background:#f8d7da;color:#721c24;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:400}
      .menu-footer{text-align:center;font-size:11px;color:#999;margin-top:16px;padding-top:12px;border-top:1px solid #eee}
      @media print{
        .menu-modal,.menu-modal-hdr,.menu-actions,.menu-qr,.menu-body{all:unset!important;display:block!important}
        body>*:not(#ruviaMenuOverlay){display:none!important}
        .menu-wrap{padding:16mm;max-width:180mm;margin:0 auto}
      }
      </style>
      <div class="menu-modal">
        <div class="menu-modal-hdr">
          <h3>📋 Menu Preview & Print</h3>
          <button onclick="document.getElementById('ruviaMenuOverlay').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer">✕</button>
        </div>
        <div class="menu-actions">
          <button class="menu-btn" style="background:#2c5f4a;color:#fff" onclick="window.print()">🖨 Print Menu</button>
          <button class="menu-btn" style="background:#17a2b8;color:#fff" onclick="document.getElementById('ruviaMenuOverlay').remove()">Close</button>
        </div>
        <div class="menu-body">
          <div class="menu-preview">${menuHTML}</div>
          <div class="menu-qr">
            <div class="menu-qr-title">📱 Scan for Menu</div>
            <img src="${qrURL(menuURL)}" alt="Menu QR Code" onerror="this.parentElement.innerHTML='<div style=\\'padding:16px;font-size:11px;color:#999;text-align:center\\'>QR code requires internet connection</div>'">
            <div class="menu-qr-sub">Share with guests</div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  window.RuviaMenuPrint = { show, buildMenuHTML, qrURL };

})();
