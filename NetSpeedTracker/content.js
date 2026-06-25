// NetSpeedTracker — content script
// Minimal overlay, full-widget drag, proper close

(function () {
  if (document.getElementById('nst-root')) return;

  // ── INJECT STYLES ──────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #nst-root {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      bottom: 28px;
      right: 28px;
      width: 164px;
      background: rgba(15, 15, 20, 0.93);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(139, 92, 246, 0.25);
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(139,92,246,0.1);
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      color: #e2e2e2;
      user-select: none;
      cursor: grab;
    }
    #nst-root.dragging { cursor: grabbing; }
    #nst-root.hidden { display: none !important; }

    #nst-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px 6px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    #nst-logo {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    #nst-icon {
      width: 14px;
      height: 14px;
      position: relative;
      display: flex;
      align-items: flex-end;
      gap: 2px;
    }
    #nst-icon span {
      display: block;
      width: 3px;
      border-radius: 1px;
      background: #8b5cf6;
    }
    #nst-icon span:nth-child(1) { height: 5px; opacity: 0.5; }
    #nst-icon span:nth-child(2) { height: 8px; opacity: 0.75; }
    #nst-icon span:nth-child(3) { height: 12px; }
    #nst-brand {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: rgba(139, 92, 246, 0.85);
      text-transform: uppercase;
    }
    #nst-close {
      width: 16px;
      height: 16px;
      border: none;
      background: none;
      color: rgba(255,255,255,0.28);
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      padding: 0;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
      font-family: monospace;
    }
    #nst-close:hover {
      color: #f87171;
      background: rgba(248,113,113,0.12);
    }

    #nst-body {
      padding: 10px 12px 11px;
    }
    #nst-speed-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 8px;
    }
    #nst-speed-val {
      font-size: 28px;
      font-weight: 700;
      color: #a78bfa;
      letter-spacing: -0.02em;
      line-height: 1;
      transition: color 0.4s;
    }
    #nst-speed-unit {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.06em;
      padding-bottom: 2px;
    }

    #nst-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .nst-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nst-lbl {
      font-size: 8px;
      color: rgba(255,255,255,0.28);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .nst-val {
      font-size: 10px;
      font-weight: 600;
      color: #c4b5fd;
      letter-spacing: 0.02em;
    }

    #nst-status-bar {
      margin-top: 8px;
      padding-top: 7px;
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    #nst-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8b5cf6;
      box-shadow: 0 0 5px #8b5cf6;
      flex-shrink: 0;
      animation: nst-blink 2s ease-in-out infinite;
    }
    @keyframes nst-blink {
      0%,100% { opacity:1; } 50% { opacity:0.4; }
    }
    #nst-quality {
      font-size: 9px;
      font-weight: 600;
      color: #8b5cf6;
      letter-spacing: 0.06em;
      transition: color 0.4s;
    }
  `;
  document.documentElement.appendChild(style);

  // ── BUILD DOM ──────────────────────────────────
  const root = document.createElement('div');
  root.id = 'nst-root';
  root.innerHTML = `
    <div id="nst-header">
      <div id="nst-logo">
        <div id="nst-icon">
          <span></span><span></span><span></span>
        </div>
        <span id="nst-brand">NetSpeed</span>
      </div>
      <button id="nst-close">✕</button>
    </div>
    <div id="nst-body">
      <div id="nst-speed-row">
        <span id="nst-speed-val">—</span>
        <span id="nst-speed-unit">Mbps</span>
      </div>
      <div id="nst-meta">
        <div class="nst-row">
          <span class="nst-lbl">Ping</span>
          <span class="nst-val" id="nst-ping">— ms</span>
        </div>
        <div class="nst-row">
          <span class="nst-lbl">Peak</span>
          <span class="nst-val" id="nst-peak">— Mbps</span>
        </div>
        <div class="nst-row">
          <span class="nst-lbl">Avg</span>
          <span class="nst-val" id="nst-avg">— Mbps</span>
        </div>
      </div>
      <div id="nst-status-bar">
        <div id="nst-dot"></div>
        <span id="nst-quality">Measuring…</span>
      </div>
    </div>
  `;
  document.documentElement.appendChild(root);

  // ── DRAG (full widget, not just handle) ────────
  let dragging = false, ox = 0, oy = 0;

  root.addEventListener('mousedown', (e) => {
    if (e.target.id === 'nst-close') return;
    dragging = true;
    root.classList.add('dragging');
    const rect = root.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    // switch from bottom/right to top/left
    root.style.bottom = 'auto';
    root.style.right = 'auto';
    root.style.left = rect.left + 'px';
    root.style.top = rect.top + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    root.style.left = (e.clientX - ox) + 'px';
    root.style.top = (e.clientY - oy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    root.classList.remove('dragging');
  });

  // ── CLOSE ──────────────────────────────────────
  document.getElementById('nst-close').addEventListener('click', (e) => {
    e.stopPropagation();
    root.classList.add('hidden');
    try { chrome.runtime.sendMessage({ type: 'STOP' }); } catch(_) {}
  });

  // ── HELPERS ────────────────────────────────────
  function fmt(mbps) {
    if (!mbps || mbps <= 0) return { v: '—', u: 'Mbps' };
    if (mbps >= 1000) return { v: (mbps/1000).toFixed(2), u: 'Gbps' };
    if (mbps >= 100)  return { v: mbps.toFixed(1),        u: 'Mbps' };
    return               { v: mbps.toFixed(2),             u: 'Mbps' };
  }

  function quality(mbps) {
    if (!mbps || mbps <= 0) return { label: 'Measuring…', color: '#6b7280' };
    if (mbps < 1)   return { label: 'Very Slow',  color: '#ef4444' };
    if (mbps < 5)   return { label: 'Slow',       color: '#f97316' };
    if (mbps < 25)  return { label: 'Good',       color: '#eab308' };
    if (mbps < 100) return { label: 'Fast',       color: '#22c55e' };
    if (mbps < 500) return { label: 'Very Fast',  color: '#a78bfa' };
    return               { label: 'Ultra Fast',   color: '#38bdf8' };
  }

  // ── UPDATE UI ──────────────────────────────────
  let peak = 0, history = [];

  function update(speed, latency, hist) {
    if (hist) history = hist;

    const { v, u } = fmt(speed);
    document.getElementById('nst-speed-val').textContent = v;
    document.getElementById('nst-speed-unit').textContent = u;

    if (speed > peak) peak = speed;
    const { label, color } = quality(speed);

    document.getElementById('nst-speed-val').style.color = color;
    document.getElementById('nst-ping').textContent  = latency > 0 ? `${latency} ms` : '— ms';
    document.getElementById('nst-peak').textContent  = peak > 0 ? `${fmt(peak).v} ${fmt(peak).u}` : '— Mbps';

    if (history.length > 0) {
      const avg = history.reduce((a,b) => a + b.speed, 0) / history.length;
      document.getElementById('nst-avg').textContent = `${fmt(avg).v} ${fmt(avg).u}`;
    }

    document.getElementById('nst-dot').style.background  = color;
    document.getElementById('nst-dot').style.boxShadow   = `0 0 5px ${color}`;
    document.getElementById('nst-quality').textContent   = label;
    document.getElementById('nst-quality').style.color   = color;
  }

  // ── MESSAGES ───────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SPEED_UPDATE') {
      root.classList.remove('hidden');
      update(msg.speed, msg.latency, msg.history);
    }
    if (msg.type === 'OVERLAY_HIDE') root.classList.add('hidden');
    if (msg.type === 'OVERLAY_SHOW') root.classList.remove('hidden');
  });

  // init
  try {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res && res.running) update(res.speed, res.latency, []);
      else chrome.runtime.sendMessage({ type: 'START' });
    });
  } catch(_) {}

})();
