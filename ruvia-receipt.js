/**
 * RuviaOS — Receipt System
 * Usage: RuviaReceipt.show(orderData) / RuviaReceipt.print(orderData)
 * Include: <script src="ruvia-receipt.js"></script>
 */
(function () {

  const HOTEL_CONFIG_KEY = 'ruvia_hotel_config';

  function getConfig() {
    const defaults = {
      hotelName: 'Ruvia Hotel',
      address: 'Kampala, Uganda',
      phone: '+256 700 000000',
      email: 'info@ruviahotel.com',
      taxId: 'URA-123456',
      currency: 'USh',
      vatRate: 18,
      showVAT: true,
      footerMessage: 'Thank you for visiting Ruvia Hotel!',
      receiptWidth: 'thermal' // 'thermal' (80mm) or 'a4'
    };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(HOTEL_CONFIG_KEY)) }; }
    catch(e) { return defaults; }
  }

  function fmt(n) {
    const cfg = getConfig();
    return cfg.currency + ' ' + Math.round(n || 0).toLocaleString();
  }

  function buildReceiptHTML(order, config) {
    const cfg = config || getConfig();
    const now = new Date(order.created_at || Date.now());
    const cashier = order.cashier || order.guest_name || localStorage.getItem('ruviaos_user') || '';
    const items = order.items || [];
    const subtotal = items.reduce((s, i) => s + (i.unit_price || i.price || 0) * i.quantity, 0);
    const vatAmt = cfg.showVAT ? Math.round(subtotal * cfg.vatRate / 100) : 0;
    const total = subtotal + vatAmt;

    const linesHTML = items.map(item => `
      <tr>
        <td style="padding:3px 0;vertical-align:top">${item.name}</td>
        <td style="padding:3px 0;text-align:center;width:30px">${item.quantity}</td>
        <td style="padding:3px 0;text-align:right;width:70px">${fmt(item.unit_price || item.price || 0)}</td>
        <td style="padding:3px 0;text-align:right;width:75px">${fmt((item.unit_price || item.price || 0) * item.quantity)}</td>
      </tr>`).join('');

    return `
      <div class="rcpt-wrap">
        <div class="rcpt-head">
          <div class="rcpt-hotel">${cfg.hotelName}</div>
          <div class="rcpt-addr">${cfg.address}</div>
          ${cfg.phone ? `<div class="rcpt-addr">Tel: ${cfg.phone}</div>` : ''}
          ${cfg.email ? `<div class="rcpt-addr">${cfg.email}</div>` : ''}
          ${cfg.taxId ? `<div class="rcpt-addr">TIN: ${cfg.taxId}</div>` : ''}
        </div>
        <div class="rcpt-divider">- - - - - - - - - - - - - - -</div>
        <div class="rcpt-meta">
          <div>Receipt #: <strong>${order.order_number || ('ORD-' + (order.id || Date.now().toString().slice(-6)))}</strong></div>
          <div>Date: ${now.toLocaleDateString('en-GB')}</div>
          <div>Time: ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
          ${cashier ? `<div>Served by: ${cashier}</div>` : ''}
          ${order.table ? `<div>Table: ${order.table}</div>` : ''}
          ${order.guest_name && order.guest_name !== 'Walk-in' ? `<div>Guest: ${order.guest_name}</div>` : ''}
          <div>Type: ${(order.order_type || 'dine_in').replace('_', ' ').toUpperCase()}</div>
        </div>
        <div class="rcpt-divider">- - - - - - - - - - - - - - -</div>
        <table class="rcpt-items" style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:1px dashed #ccc">
              <th style="text-align:left;padding:3px 0;font-weight:600">Item</th>
              <th style="text-align:center;width:30px;font-weight:600">Qty</th>
              <th style="text-align:right;width:70px;font-weight:600">Price</th>
              <th style="text-align:right;width:75px;font-weight:600">Amount</th>
            </tr>
          </thead>
          <tbody>${linesHTML}</tbody>
        </table>
        <div class="rcpt-divider">- - - - - - - - - - - - - - -</div>
        <div class="rcpt-totals">
          <div class="rcpt-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${cfg.showVAT ? `<div class="rcpt-row"><span>VAT (${cfg.vatRate}%)</span><span>${fmt(vatAmt)}</span></div>` : ''}
          <div class="rcpt-row rcpt-total"><span>TOTAL</span><span>${fmt(total)}</span></div>
          <div class="rcpt-row"><span>Payment</span><span>${(order.payment_method || 'CASH').toUpperCase()}</span></div>
        </div>
        <div class="rcpt-divider">- - - - - - - - - - - - - - -</div>
        <div class="rcpt-footer">${cfg.footerMessage}</div>
        <div class="rcpt-footer" style="margin-top:4px;font-size:10px">Powered by RuviaOS</div>
      </div>`;
  }

  const STYLE = `
    <style>
    .rcpt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
    .rcpt-modal{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    .rcpt-modal-hdr{padding:16px 20px;background:#1a3c34;color:#fff;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
    .rcpt-modal-hdr h3{font-size:15px;font-weight:600;margin:0}
    .rcpt-modal-actions{display:flex;gap:8px;padding:12px 20px;border-bottom:1px solid #eee;flex-shrink:0;flex-wrap:wrap;background:#f8f9fa}
    .rcpt-btn{padding:8px 16px;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
    .rcpt-btn-print{background:#2c5f4a;color:#fff}
    .rcpt-btn-close{background:#6c757d;color:#fff}
    .rcpt-btn-config{background:#fff;border:1px solid #ddd;color:#555}
    .rcpt-body{padding:20px;overflow-y:auto;flex:1;background:#f5f5f5}
    .rcpt-paper{background:#fff;padding:20px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.1);font-family:'Courier New',Courier,monospace;font-size:13px;max-width:320px;margin:0 auto}
    .rcpt-wrap{color:#222}
    .rcpt-head{text-align:center;margin-bottom:10px}
    .rcpt-hotel{font-size:16px;font-weight:700;margin-bottom:4px}
    .rcpt-addr{font-size:11px;color:#555;margin-bottom:2px}
    .rcpt-divider{text-align:center;color:#aaa;margin:8px 0;font-size:11px;letter-spacing:1px}
    .rcpt-meta{font-size:11px;color:#444;line-height:1.7}
    .rcpt-totals{margin-top:6px}
    .rcpt-row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
    .rcpt-total{font-size:14px;font-weight:700;padding:5px 0;border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;margin:4px 0}
    .rcpt-footer{text-align:center;font-size:11px;color:#666;margin-top:6px}
    .rcpt-config{padding:16px;display:none}
    .rcpt-config.open{display:block}
    .rcpt-cfg-row{display:flex;gap:12px;margin-bottom:10px;align-items:center;flex-wrap:wrap}
    .rcpt-cfg-row label{font-size:12px;font-weight:600;color:#555;min-width:100px}
    .rcpt-cfg-row input,.rcpt-cfg-row select{flex:1;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:12px}
    @media print{
      .rcpt-overlay,.rcpt-modal,.rcpt-modal-hdr,.rcpt-modal-actions,.rcpt-body{all:unset!important;display:block!important;background:none!important;padding:0!important;margin:0!important}
      body > *:not(#ruviaReceiptOverlay){display:none!important}
      .rcpt-paper{box-shadow:none!important;max-width:80mm!important;margin:0!important;padding:4mm!important}
    }
    </style>`;

  function show(order) {
    if (document.getElementById('ruviaReceiptOverlay')) document.getElementById('ruviaReceiptOverlay').remove();
    const cfg = getConfig();
    const overlay = document.createElement('div');
    overlay.className = 'rcpt-overlay';
    overlay.id = 'ruviaReceiptOverlay';
    overlay.innerHTML = STYLE + `
      <div class="rcpt-modal">
        <div class="rcpt-modal-hdr">
          <h3>🧾 Receipt Preview</h3>
          <button class="rcpt-btn rcpt-btn-close" onclick="document.getElementById('ruviaReceiptOverlay').remove()" style="background:rgba(255,255,255,.2);padding:5px 12px">✕</button>
        </div>
        <div class="rcpt-modal-actions">
          <button class="rcpt-btn rcpt-btn-print" onclick="RuviaReceipt.doPrint()">🖨 Print Receipt</button>
          <button class="rcpt-btn rcpt-btn-config" onclick="document.getElementById('rcptConfig').classList.toggle('open')">⚙ Settings</button>
          <button class="rcpt-btn rcpt-btn-close" onclick="document.getElementById('ruviaReceiptOverlay').remove()">Close</button>
        </div>
        <div class="rcpt-config" id="rcptConfig">
          <div class="rcpt-cfg-row"><label>Hotel Name</label><input id="cfgName" value="${cfg.hotelName}"></div>
          <div class="rcpt-cfg-row"><label>Phone</label><input id="cfgPhone" value="${cfg.phone}"></div>
          <div class="rcpt-cfg-row"><label>Address</label><input id="cfgAddr" value="${cfg.address}"></div>
          <div class="rcpt-cfg-row"><label>Footer msg</label><input id="cfgFooter" value="${cfg.footerMessage}"></div>
          <div class="rcpt-cfg-row"><label>Show VAT</label><select id="cfgVat"><option value="1" ${cfg.showVAT?'selected':''}>Yes</option><option value="0" ${!cfg.showVAT?'selected':''}>No</option></select></div>
          <div class="rcpt-cfg-row"><label>VAT Rate %</label><input type="number" id="cfgVatRate" value="${cfg.vatRate}" style="max-width:80px"></div>
          <button class="rcpt-btn rcpt-btn-print" style="margin-top:4px" onclick="RuviaReceipt.saveConfig()">Save Settings</button>
        </div>
        <div class="rcpt-body">
          <div class="rcpt-paper" id="rcptPaperContent">
            ${buildReceiptHTML(order, cfg)}
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    // Store current order for print
    window._ruviaCurrentOrder = order;
  }

  function doPrint() {
    window.print();
  }

  function saveConfig() {
    const cfg = getConfig();
    cfg.hotelName = document.getElementById('cfgName')?.value || cfg.hotelName;
    cfg.phone = document.getElementById('cfgPhone')?.value || cfg.phone;
    cfg.address = document.getElementById('cfgAddr')?.value || cfg.address;
    cfg.footerMessage = document.getElementById('cfgFooter')?.value || cfg.footerMessage;
    cfg.showVAT = document.getElementById('cfgVat')?.value === '1';
    cfg.vatRate = parseInt(document.getElementById('cfgVatRate')?.value) || 18;
    localStorage.setItem(HOTEL_CONFIG_KEY, JSON.stringify(cfg));
    // Re-render
    const paper = document.getElementById('rcptPaperContent');
    if (paper && window._ruviaCurrentOrder) {
      paper.innerHTML = buildReceiptHTML(window._ruviaCurrentOrder, cfg);
    }
  }

  window.RuviaReceipt = { show, doPrint, saveConfig, buildReceiptHTML, getConfig };

})();
