(function () {
  let active = false;
  let hoverEl = null;
  let hudEl = null;
  let outlineEl = null;

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    const matches = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!matches) return rgb;
    return '#' + ((1 << 24) + (parseInt(matches[1]) << 16) + (parseInt(matches[2]) << 8) + parseInt(matches[3])).toString(16).slice(1);
  }

  function createOverlay() {
    if (!outlineEl) {
      outlineEl = document.createElement('div');
      outlineEl.id = 'devlens-outline';
      document.body.appendChild(outlineEl);
    }
    if (!hudEl) {
      hudEl = document.createElement('div');
      hudEl.id = 'devlens-hud';
      document.body.appendChild(hudEl);
    }
  }

  function removeOverlay() {
    if (outlineEl) { outlineEl.remove(); outlineEl = null; }
    if (hudEl) { hudEl.remove(); hudEl = null; }
  }

  function onMouseMove(e) {
    if (!active) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === outlineEl || target === hudEl || hudEl.contains(target)) return;

    hoverEl = target;
    const rect = hoverEl.getBoundingClientRect();
    const style = window.getComputedStyle(hoverEl);

    const bgHex = rgbToHex(style.backgroundColor);
    const textHex = rgbToHex(style.color);
    const font = style.fontFamily.split(',')[0].replace(/['"]/g, '');
    const fontSize = style.fontSize;
    const padding = `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;

    outlineEl.style.top = `${rect.top + window.scrollY}px`;
    outlineEl.style.left = `${rect.left + window.scrollX}px`;
    outlineEl.style.width = `${rect.width}px`;
    outlineEl.style.height = `${rect.height}px`;
    outlineEl.style.display = 'block';

    hudEl.innerHTML = `
      <div class="hud-tag">&lt;${hoverEl.tagName.toLowerCase()}&gt;</div>
      <div class="hud-row"><span class="hud-swatch" style="background:${bgHex}"></span> BG: <strong>${bgHex}</strong></div>
      <div class="hud-row"><span class="hud-swatch" style="background:${textHex}"></span> Text: <strong>${textHex}</strong></div>
      <div class="hud-row">Font: <strong>${font} ${fontSize}</strong></div>
      <div class="hud-row">Size: <strong>${Math.round(rect.width)}px × ${Math.round(rect.height)}px</strong></div>
      <div class="hud-tip">Click to Save Color Token</div>
    `;

    let hudLeft = e.clientX + 16;
    let hudTop = e.clientY + 16;
    if (hudLeft + 220 > window.innerWidth) hudLeft = e.clientX - 230;
    if (hudTop + 140 > window.innerHeight) hudTop = e.clientY - 150;

    hudEl.style.left = `${hudLeft}px`;
    hudEl.style.top = `${hudTop}px`;
    hudEl.style.display = 'block';
  }

  function onClick(e) {
    if (!active || !hoverEl) return;
    e.preventDefault();
    e.stopPropagation();

    const style = window.getComputedStyle(hoverEl);
    const bgHex = rgbToHex(style.backgroundColor);
    const colorObj = {
      hex: bgHex !== '#000000' ? bgHex : rgbToHex(style.color),
      name: `<${hoverEl.tagName.toLowerCase()}> token`,
      tag: 'Inspected'
    };

    chrome.runtime.sendMessage({ action: 'SAVE_COLOR', color: colorObj }, (res) => {
      hudEl.querySelector('.hud-tip').textContent = 'Saved to DevLens Palette!';
      setTimeout(() => {
        if (hudEl) hudEl.querySelector('.hud-tip').textContent = 'Click to Save Color Token';
      }, 1500);
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'TOGGLE_INSPECTOR_OVERLAY') {
      active = !active;
      if (active) {
        createOverlay();
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('click', onClick, true);
      } else {
        removeOverlay();
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('click', onClick, true);
      }
    }
  });
})();
