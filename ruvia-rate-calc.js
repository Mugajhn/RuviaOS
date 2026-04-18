/**
 * RuviaOS — Room Rate Calculator
 * Usage: RuviaRateCalc.show(roomId) or add <div id="ruvia-rate-calc"></div>
 */
(function () {

  const SEASONAL_ADJUSTMENTS = {
    0: 1.1, // Jan
    1: 1.0, 2: 1.0, 3: 1.05, 4: 1.05, 5: 1.0,
    6: 1.2, 7: 1.25, // Jul/Aug peak
    8: 1.0, 9: 1.05, 10: 1.0,
    11: 1.3 // Dec peak
  };

  function calcRate(basePrice, checkIn, checkOut, options) {
    const ci = new Date(checkIn), co = new Date(checkOut);
    const nights = Math.max(1, Math.round((co - ci) / 86400000));
    const opts = options || {};

    let total = 0, breakdown = [];

    for (let i = 0; i < nights; i++) {
      const d = new Date(ci); d.setDate(d.getDate() + i);
      const day = d.getDay();
      const month = d.getMonth();
      let dayRate = basePrice;

      // Weekend surcharge
      const isWeekend = day === 5 || day === 6;
      if (isWeekend && !opts.noWeekend) dayRate *= 1.15;

      // Seasonal
      const seasonal = SEASONAL_ADJUSTMENTS[month] || 1;
      dayRate *= seasonal;

      // Length of stay discount
      if (nights >= 7) dayRate *= 0.9;
      else if (nights >= 3) dayRate *= 0.95;

      // Promo code
      if (opts.promoCode === 'WELCOME10') dayRate *= 0.9;
      if (opts.promoCode === 'WELCOMEBACK10') dayRate *= 0.9;

      total += dayRate;
      breakdown.push({ date: d.toISOString().slice(0,10), rate: Math.round(dayRate), isWeekend, seasonal });
    }

    const subtotal = Math.round(total);
    const vat = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + vat;

    return { nights, subtotal, vat, grandTotal, breakdown, basePrice };
  }

  function show(container, basePrice, checkIn, checkOut) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;

    container.innerHTML = `
      <style>
      .rrc-wrap{font-family:'Segoe UI',system-ui,sans-serif;font-size:13px}
      .rrc-row{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
      .rrc-field{flex:1;min-width:120px}
      .rrc-field label{display:block;font-size:11px;font-weight:600;color:var(--text2,#666);margin-bottom:4px;text-transform:uppercase}
      .rrc-field input,.rrc-field select{width:100%;padding:8px 10px;border:1px solid var(--input-border,#ddd);border-radius:7px;font-size:13px;background:var(--input-bg,#fff);color:var(--text,#222);outline:none}
      .rrc-field input:focus{border-color:#2c5f4a}
      .rrc-result{background:var(--card,#fff);border-radius:10px;overflow:hidden;margin-top:10px;border:1px solid var(--border,#eee)}
      .rrc-result-hdr{background:#2c5f4a;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
      .rrc-total-big{font-size:22px;font-weight:700}
      .rrc-nights{font-size:12px;opacity:.85}
      .rrc-breakdown{max-height:180px;overflow-y:auto}
      .rrc-brow{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid var(--border,#eee);font-size:12px}
      .rrc-brow:last-child{border-bottom:none}
      .rrc-brow .date{color:var(--text2,#666)}
      .rrc-brow .rate{font-weight:600;color:var(--text,#222)}
      .rrc-brow .tag{font-size:10px;background:#fff3cd;color:#856404;padding:1px 6px;border-radius:10px;margin-left:6px}
      .rrc-summary{padding:10px 14px;background:var(--th-bg,#f8f9fa);border-top:1px solid var(--border,#eee)}
      .rrc-sum-row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;color:var(--text,#222)}
      .rrc-sum-total{font-weight:700;font-size:14px;padding-top:6px;border-top:1px dashed var(--border,#ccc);margin-top:4px}
      .rrc-promo{display:flex;gap:8px;margin-top:8px}
      .rrc-promo input{flex:1;padding:7px 10px;border:1px solid var(--input-border,#ddd);border-radius:7px;font-size:12px;background:var(--input-bg,#fff);color:var(--text,#222)}
      .rrc-promo button{padding:7px 14px;background:#2c5f4a;color:#fff;border:none;border-radius:7px;font-size:12px;cursor:pointer;font-weight:600}
      .rrc-discount-msg{font-size:11px;color:#28a745;margin-top:4px;display:none}
      </style>
      <div class="rrc-wrap">
        <div class="rrc-row">
          <div class="rrc-field"><label>Check In</label><input type="date" id="rrc-in" value="${checkIn||''}"></div>
          <div class="rrc-field"><label>Check Out</label><input type="date" id="rrc-out" value="${checkOut||''}"></div>
          <div class="rrc-field"><label>Base Rate (UGX/night)</label><input type="number" id="rrc-base" value="${basePrice||80000}" step="1000"></div>
        </div>
        <div class="rrc-promo">
          <input type="text" id="rrc-promo" placeholder="Promo code (e.g. WELCOME10)" style="text-transform:uppercase">
          <button onclick="rrcCalculate()">Calculate</button>
        </div>
        <div class="rrc-discount-msg" id="rrc-discount-msg">✅ Promo code applied!</div>
        <div id="rrc-result"></div>
      </div>`;

    // Set min date to today
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('rrc-in').min = today;
    document.getElementById('rrc-out').min = today;

    // Default dates if not set
    if (!document.getElementById('rrc-in').value) {
      document.getElementById('rrc-in').value = today;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('rrc-out').value = tomorrow.toISOString().slice(0, 10);
    }

    window.rrcCalculate = function () {
      const ci = document.getElementById('rrc-in').value;
      const co = document.getElementById('rrc-out').value;
      const base = parseInt(document.getElementById('rrc-base').value) || 80000;
      const promo = document.getElementById('rrc-promo')?.value?.trim().toUpperCase() || '';

      if (!ci || !co || new Date(co) <= new Date(ci)) {
        document.getElementById('rrc-result').innerHTML = '<div style="padding:10px;color:#dc3545;font-size:12px">Please select valid check-in and check-out dates.</div>';
        return;
      }

      const result = calcRate(base, ci, co, { promoCode: promo });
      const promoMsg = document.getElementById('rrc-discount-msg');
      if (promo === 'WELCOME10' || promo === 'WELCOMEBACK10') {
        promoMsg.style.display = 'block';
      } else {
        promoMsg.style.display = 'none';
      }

      const fmtUGX = n => 'USh ' + Math.round(n).toLocaleString();

      document.getElementById('rrc-result').innerHTML = `
        <div class="rrc-result">
          <div class="rrc-result-hdr">
            <div>
              <div class="rrc-total-big">${fmtUGX(result.grandTotal)}</div>
              <div class="rrc-nights">${result.nights} night${result.nights !== 1 ? 's' : ''} · incl. 18% VAT</div>
            </div>
            <div style="text-align:right;font-size:12px;opacity:.8">${ci} to ${co}</div>
          </div>
          <div class="rrc-breakdown">
            ${result.breakdown.map(d => `
              <div class="rrc-brow">
                <span class="date">${new Date(d.date + 'T12:00').toLocaleDateString('en-GB', {weekday:'short',day:'numeric',month:'short'})}</span>
                <span class="rate">${fmtUGX(d.rate)}${d.isWeekend ? '<span class="tag">Weekend</span>' : ''}</span>
              </div>`).join('')}
          </div>
          <div class="rrc-summary">
            <div class="rrc-sum-row"><span>Subtotal (${result.nights} nights)</span><span>${fmtUGX(result.subtotal)}</span></div>
            <div class="rrc-sum-row"><span>VAT 18%</span><span>${fmtUGX(result.vat)}</span></div>
            ${promo ? `<div class="rrc-sum-row" style="color:#28a745"><span>Promo (${promo})</span><span>Applied ✓</span></div>` : ''}
            <div class="rrc-sum-row rrc-sum-total"><span>Total</span><span>${fmtUGX(result.grandTotal)}</span></div>
          </div>
        </div>`;
    };

    // Auto-calculate on input change
    ['rrc-in', 'rrc-out', 'rrc-base'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', window.rrcCalculate);
    });

    window.rrcCalculate();
  }

  window.RuviaRateCalc = { show, calcRate };

})();
