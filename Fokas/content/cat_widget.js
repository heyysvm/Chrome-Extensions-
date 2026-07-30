(function () {
  const OVERLAY_ID = 'fokas-violation-banner';

  function createOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return;

    const catImgUrl = chrome.runtime.getURL('assets/cat_angry.jpg');
    const catRealUrl = chrome.runtime.getURL('assets/cat_angry_real.jpg');

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      background: radial-gradient(circle at center, rgba(140, 20, 20, 0.97) 0%, rgba(65, 8, 8, 0.98) 55%, rgba(20, 2, 2, 0.99) 100%) !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      margin: 0 !important;
      padding: 24px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      backdrop-filter: blur(20px) !important;
      overflow: hidden !important;
    `;

    overlay.innerHTML = `
      <div style="display:flex !important; align-items:center !important; justify-content:center !important; gap:12px !important; margin-bottom:12px !important;">
        <span style="font-size:32px !important; line-height:1 !important;">😾</span>
        <span style="font-size:28px !important; line-height:1 !important;">🚨</span>
        <span style="font-size:32px !important; line-height:1 !important;">🐾</span>
      </div>

      <div style="display:flex !important; flex-direction:column !important; align-items:center !important; gap:6px !important; max-width:650px !important; margin-bottom:14px !important;">
        <h1 style="font-size:30px !important; font-weight:900 !important; color:#ffffff !important; letter-spacing:0.04em !important; text-transform:uppercase !important; margin:0 !important; line-height:1.2 !important; text-shadow:0 3px 15px rgba(0,0,0,0.8), 0 0 25px rgba(239,68,68,0.8) !important;">
          BAND KRRR BSDKS!! 🚫 🤬 — FOKAS CAT ENFORCER 😾
        </h1>
        <p style="font-size:15px !important; font-weight:500 !important; color:rgba(255,255,255,0.9) !important; margin:0 !important; line-height:1.3 !important;">
          You drifted off to a forbidden tab! Return to your focus session right now.
        </p>
      </div>

      <div style="margin:10px 0 20px 0 !important; display:flex !important; justify-content:center !important; align-items:center !important;">
        <div id="fokasCatContainer" style="position:relative !important; width:220px !important; height:220px !important; display:flex !important; align-items:center !important; justify-content:center !important; background:radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(0,0,0,0.6) 70%) !important; border-radius:50% !important; border:4px solid #ef4444 !important; box-shadow:0 0 45px rgba(239, 68, 68, 0.85), 0 10px 30px rgba(0,0,0,0.8) !important;">
          <img id="fokasCatImg" src="${catImgUrl}" onerror="if(this.src!=='${catRealUrl}'){this.src='${catRealUrl}';}else{this.style.display='none';document.getElementById('fokasCatSvg').style.display='block';}" alt="Angry Cat Enforcer" style="width:100% !important; height:100% !important; object-fit:cover !important; border-radius:50% !important;" />
          <svg id="fokasCatSvg" width="170" height="170" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6));">
            <circle cx="100" cy="100" r="92" fill="#ef4444" opacity="0.25"/>
            <polygon points="15,65 55,35 75,65" fill="#1e1e24"/>
            <polygon points="22,63 55,42 68,63" fill="#dc2626"/>
            <polygon points="185,65 145,35 125,65" fill="#1e1e24"/>
            <polygon points="178,63 145,42 132,63" fill="#dc2626"/>
            <ellipse cx="100" cy="105" rx="76" ry="62" fill="#2d303e"/>
            <path d="M45 76 L88 92" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
            <path d="M155 76 L112 92" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
            <polygon points="52,94 84,100 60,114" fill="#fbbf24"/>
            <polygon points="148,94 116,100 140,114" fill="#fbbf24"/>
            <ellipse cx="68" cy="102" rx="3.5" ry="8" fill="#000000"/>
            <ellipse cx="132" cy="102" rx="3.5" ry="8" fill="#000000"/>
            <polygon points="100,114 92,122 108,122" fill="#f87171"/>
            <path d="M74 128 Q100 118 126 128 Q100 156 74 128 Z" fill="#7f1d1d" stroke="#ef4444" stroke-width="2.5"/>
            <polygon points="84,126 88,137 92,126" fill="#ffffff"/>
            <polygon points="108,126 112,137 116,126" fill="#ffffff"/>
            <line x1="10" y1="108" x2="58" y2="118" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
            <line x1="5" y1="128" x2="56" y2="126" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
            <line x1="190" y1="108" x2="142" y2="118" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
            <line x1="195" y1="128" x2="144" y2="126" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <div style="display:flex !important; align-items:center !important; justify-content:center !important; gap:14px !important; flex-wrap:wrap !important;">
        <button id="fokasReturnBtn" style="background:#ffffff !important; color:#881337 !important; border:none !important; padding:12px 28px !important; border-radius:12px !important; font-size:15px !important; font-weight:800 !important; cursor:pointer !important; box-shadow:0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(255,255,255,0.4) !important; transition:all 0.2s ease !important;">
          🎯 Back to Focus Tab
        </button>
        <button id="fokasMuteBtn" style="background:rgba(255,255,255,0.18) !important; color:#ffffff !important; border:1px solid rgba(255,255,255,0.35) !important; padding:12px 20px !important; border-radius:12px !important; font-size:14px !important; font-weight:600 !important; cursor:pointer !important; transition:all 0.2s ease !important;">
          🤫 Mute Siren (10s)
        </button>
      </div>
    `;

    const targetContainer = document.body || document.documentElement;
    if (targetContainer) {
      targetContainer.appendChild(overlay);
    }

    const returnBtn = overlay.querySelector('#fokasReturnBtn');
    if (returnBtn) {
      returnBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'SWITCH_TO_WHITELISTED_TAB' });
      };
    }

    const muteBtn = overlay.querySelector('#fokasMuteBtn');
    if (muteBtn) {
      muteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'USER_ACKNOWLEDGED_TEMP' });
        muteBtn.textContent = '⏸ Muted (10s)';
        muteBtn.disabled = true;
        setTimeout(() => {
          const btn = document.getElementById('fokasMuteBtn');
          if (btn) {
            btn.textContent = '🤫 Mute Siren (10s)';
            btn.disabled = false;
          }
        }, 10000);
      };
    }
  }

  function removeOverlay() {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
      existing.remove();
    }
  }

  if (!window.fokasListenerAdded) {
    window.fokasListenerAdded = true;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'SHOW_VIOLATION_BANNER') {
        createOverlay();
        sendResponse({ status: 'banner_shown' });
      } else if (request.action === 'HIDE_VIOLATION_BANNER') {
        removeOverlay();
        sendResponse({ status: 'banner_hidden' });
      }
    });
  }

  chrome.runtime.sendMessage({ action: 'CHECK_CURRENT_TAB_STATUS' }, (res) => {
    if (res && res.isViolating) {
      createOverlay();
    } else if (res && !res.isViolating) {
      removeOverlay();
    }
  });
})();
