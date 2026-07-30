document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTimer();
  initStopwatch();
  initTasks();
  initStickyNote();
  initFocusMode();
  initFrontQuickFocusBar();
});

function initTabs() {
  const tabs = document.querySelectorAll('nav.tabs button.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const viewId = 'view-' + btn.dataset.view;
      document.getElementById(viewId).classList.add('active');
    });
  });
}

function fmt(totalSec, showMs = false) {
  totalSec = Math.max(0, totalSec);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = n => String(n).padStart(2, '0');

  if (showMs) {
    const ms = Math.floor((totalSec * 10) % 10);
    return `${pad(m)}:${pad(s)}.${ms}`;
  }
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function initFrontQuickFocusBar() {
  const frontDurationSelect = document.getElementById('frontDurationSelect');
  const frontSoundSelect = document.getElementById('frontSoundSelect');
  const focusSoundSelect = document.getElementById('focusSoundSelect');
  const frontFocusToggle = document.getElementById('frontFocusToggle');
  const frontStatusPill = document.getElementById('frontStatusPill');
  const headerFocusDot = document.getElementById('headerFocusDot');
  const frontMultiTabList = document.getElementById('frontMultiTabList');
  const selectAllTabsBtn = document.getElementById('selectAllTabsBtn');

  chrome.storage.local.get(['fokasSelectedSound'], (res) => {
    const sound = res.fokasSelectedSound || 'chodu-cid.mp3';
    if (frontSoundSelect) frontSoundSelect.value = sound;
    if (focusSoundSelect) focusSoundSelect.value = sound;
  });

  let activePreviewAudio = null;

  function playPreviewSound(soundFile) {
    if (activePreviewAudio) {
      activePreviewAudio.pause();
      activePreviewAudio = null;
    }
    try {
      const url = chrome.runtime.getURL('assets/' + soundFile);
      activePreviewAudio = new Audio(url);
      activePreviewAudio.volume = 1.0;
      activePreviewAudio.play().then(() => {
        setTimeout(() => {
          if (activePreviewAudio) {
            activePreviewAudio.pause();
            activePreviewAudio = null;
          }
        }, 3500);
      }).catch(err => console.log('Audio preview error:', err));
    } catch (err) {}
  }

  function syncSoundChoice(e) {
    const chosen = e.target.value;
    chrome.storage.local.set({ fokasSelectedSound: chosen });
    if (frontSoundSelect) frontSoundSelect.value = chosen;
    if (focusSoundSelect) focusSoundSelect.value = chosen;
    playPreviewSound(chosen);
  }

  if (frontSoundSelect) frontSoundSelect.addEventListener('change', syncSoundChoice);
  if (focusSoundSelect) focusSoundSelect.addEventListener('change', syncSoundChoice);

  let openTabsCache = [];

  chrome.runtime.sendMessage({ action: 'GET_OPEN_TABS' }, (tabs) => {
    if (tabs && tabs.length) {
      openTabsCache = tabs;
      renderTabChecklist(tabs);
    }
  });

  function renderTabChecklist(tabs) {
    frontMultiTabList.innerHTML = '';
    tabs.forEach(t => {
      const label = document.createElement('label');
      label.className = 'tab-item-check';
      const titleText = t.title ? (t.title.length > 32 ? t.title.substring(0, 32) + '...' : t.title) : t.url;
      
      label.innerHTML = `
        <input type="checkbox" data-tab-id="${t.id}" ${t.active ? 'checked' : ''}>
        <span title="${t.title || t.url}">${titleText}</span>
      `;
      frontMultiTabList.appendChild(label);
    });
  }

  selectAllTabsBtn.addEventListener('click', () => {
    const checkboxes = frontMultiTabList.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !allChecked);
    selectAllTabsBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
  });

  chrome.runtime.sendMessage({ action: 'GET_FOCUS_STATE' }, (state) => {
    updateFrontUI(state && state.active);
  });

  function updateFrontUI(isActive) {
    if (isActive) {
      frontStatusPill.textContent = 'LIVE 🐾';
      frontStatusPill.classList.add('active');
      headerFocusDot.classList.add('active');
      frontFocusToggle.textContent = '⏹ Stop Fokas Session';
      frontFocusToggle.classList.add('stop');
    } else {
      frontStatusPill.textContent = 'OFF';
      frontStatusPill.classList.remove('active');
      headerFocusDot.classList.remove('active');
      frontFocusToggle.textContent = '🐾 Start Fokas Session';
      frontFocusToggle.classList.remove('stop');
    }
  }

  frontFocusToggle.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_FOCUS_STATE' }, (state) => {
      if (state && state.active) {
        chrome.runtime.sendMessage({ action: 'STOP_FOCUS_MODE' }, () => {
          updateFrontUI(false);
          document.getElementById('focusDot').classList.remove('live');
          document.getElementById('focusLabel').textContent = 'Fokas mode is OFF';
        });
      } else {
        const selectedCheckboxes = frontMultiTabList.querySelectorAll('input[type="checkbox"]:checked');
        const allowedTabIds = Array.from(selectedCheckboxes).map(c => parseInt(c.dataset.tabId));
        const durationMin = parseInt(frontDurationSelect.value) || 25;
        const primaryTabId = allowedTabIds[0] || null;

        chrome.runtime.sendMessage({
          action: 'START_FOCUS_MODE',
          tabId: primaryTabId,
          allowedTabIds: allowedTabIds,
          durationSec: durationMin * 60
        }, () => {
          updateFrontUI(true);
          document.getElementById('focusDot').classList.add('live');
          document.getElementById('focusLabel').textContent = 'Fokas mode is LIVE 🐾';
        });
      }
    });
  });
}

let timerTotal = 25 * 60, timerRemaining = 25 * 60, timerInterval = null, timerRunning = false;

function initTimer() {
  const timerFace = document.getElementById('timerFace');
  const timerSub = document.getElementById('timerSub');
  const timerStart = document.getElementById('timerStart');
  const timerPause = document.getElementById('timerPause');
  const timerReset = document.getElementById('timerReset');

  function readInputs() {
    const h = parseInt(document.getElementById('tH').value) || 0;
    const m = parseInt(document.getElementById('tM').value) || 0;
    const s = parseInt(document.getElementById('tS').value) || 0;
    timerTotal = h * 3600 + m * 60 + s;
    timerRemaining = timerTotal;
    renderTimer();
  }

  function renderTimer() {
    timerFace.textContent = fmt(timerRemaining, false);
  }

  ['tH', 'tM', 'tS'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (!timerRunning) readInputs();
    });
  });

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const min = parseInt(chip.dataset.min) || 25;
      document.getElementById('tH').value = 0;
      document.getElementById('tM').value = min;
      document.getElementById('tS').value = 0;
      if (!timerRunning) readInputs();
    });
  });

  timerStart.addEventListener('click', () => {
    if (timerRunning) return;
    if (timerRemaining <= 0) readInputs();
    if (timerRemaining <= 0) return;

    timerRunning = true;
    timerSub.textContent = 'running...';
    timerInterval = setInterval(() => {
      timerRemaining -= 1;
      renderTimer();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSub.textContent = "time's up! 🎉";
        playAlertChime();
      }
    }, 1000);
  });

  timerPause.addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerSub.textContent = 'paused';
    }
  });

  timerReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSub.textContent = 'ready to focus';
    readInputs();
  });

  readInputs();
}

let swElapsed = 0, swInterval = null, swRunning = false, swStartTs = 0;

function initStopwatch() {
  const swFace = document.getElementById('swFace');
  const swStart = document.getElementById('swStart');
  const swLap = document.getElementById('swLap');
  const swReset = document.getElementById('swReset');
  const lapList = document.getElementById('lapList');
  let lapCount = 1;

  function renderSw() {
    swFace.textContent = fmt(swElapsed, true);
  }

  swStart.addEventListener('click', () => {
    if (!swRunning) {
      swRunning = true;
      swStartTs = Date.now() - swElapsed * 1000;
      swInterval = setInterval(() => {
        swElapsed = (Date.now() - swStartTs) / 1000;
        renderSw();
      }, 100);
      swStart.textContent = 'Pause';
    } else {
      swRunning = false;
      clearInterval(swInterval);
      swStart.textContent = 'Start';
    }
  });

  swLap.addEventListener('click', () => {
    if (!swRunning) return;
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);border-bottom:1px solid var(--line);padding:4px 0;';
    item.innerHTML = `<span>Lap ${lapCount++}</span><span style="font-family:var(--font-display);color:var(--teal)">${fmt(swElapsed, true)}</span>`;
    lapList.prepend(item);
  });

  swReset.addEventListener('click', () => {
    swRunning = false;
    clearInterval(swInterval);
    swElapsed = 0;
    lapCount = 1;
    renderSw();
    swStart.textContent = 'Start';
    lapList.innerHTML = '';
  });

  renderSw();
}

let tasks = [];
let taskIdSeq = 1;

function initTasks() {
  const taskNameInput = document.getElementById('taskName');
  const taskMinInput = document.getElementById('taskMin');
  const taskAddBtn = document.getElementById('taskAddBtn');
  const taskListEl = document.getElementById('taskList');
  const taskEmpty = document.getElementById('taskEmpty');

  function renderTasks() {
    taskListEl.innerHTML = '';
    taskEmpty.style.display = tasks.length ? 'none' : 'block';

    tasks.forEach(t => {
      const div = document.createElement('div');
      div.className = 'task' + (t.running ? ' running' : '') + (t.done ? ' done' : '');
      const pct = Math.min(100, Math.max(0, 100 - Math.round((t.remaining / t.totalSec) * 100)));
      div.innerHTML = `
        <span class="name">${t.name}</span>
        <span class="time">${fmt(t.remaining, false)}</span>
        <span class="actions">
          <button data-act="toggle">${t.running ? 'Pause' : 'Start'}</button>
          <button data-act="reset">Reset</button>
          <button data-act="del">✕</button>
        </span>
        <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--line);">
          <div style="height:100%;background:var(--amber);width:${pct}%;transition:width .3s linear;"></div>
        </div>
      `;

      div.querySelector('[data-act="toggle"]').addEventListener('click', () => toggleTask(t.id));
      div.querySelector('[data-act="reset"]').addEventListener('click', () => resetTask(t.id));
      div.querySelector('[data-act="del"]').addEventListener('click', () => delTask(t.id));

      taskListEl.appendChild(div);
    });
  }

  function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    tasks.forEach(o => { if (o.id !== id && o.running) pauseTask(o); });

    if (t.running) {
      pauseTask(t);
    } else {
      if (t.remaining <= 0) return;
      t.running = true;
      t.done = false;
      t.interval = setInterval(() => {
        t.remaining -= 1;
        if (t.remaining <= 0) {
          clearInterval(t.interval);
          t.running = false;
          t.done = true;
          t.remaining = 0;
          playAlertChime();
        }
        renderTasks();
      }, 1000);
    }
    renderTasks();
  }

  function pauseTask(t) {
    t.running = false;
    clearInterval(t.interval);
  }

  function resetTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    pauseTask(t);
    t.remaining = t.totalSec;
    t.done = false;
    renderTasks();
  }

  function delTask(id) {
    const t = tasks.find(x => x.id === id);
    if (t) pauseTask(t);
    tasks = tasks.filter(x => x.id !== id);
    renderTasks();
  }

  taskAddBtn.addEventListener('click', () => {
    const name = taskNameInput.value.trim() || 'Untitled task';
    const min = Math.max(1, parseInt(taskMinInput.value) || 25);
    tasks.push({ id: taskIdSeq++, name, totalSec: min * 60, remaining: min * 60, running: false, done: false, interval: null });
    taskNameInput.value = '';
    renderTasks();
  });

  taskNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') taskAddBtn.click();
  });

  renderTasks();
}

function initStickyNote() {
  const previewBox = document.getElementById('stickyPreview');
  const stickyText = document.getElementById('stickyText');
  const fontFamilySelect = document.getElementById('fontFamilySelect');
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const customColorPicker = document.getElementById('customColorPicker');
  const stickyStatus = document.getElementById('stickyStatus');
  const stickyLaunchPip = document.getElementById('stickyLaunchPip');
  const stickyToggleMini = document.getElementById('stickyToggleMini');

  let activeColor = '#ffe08a';
  let activeFont = "'Inter', sans-serif";
  let activeSize = '15px';
  let isMiniMode = false;

  chrome.storage.local.get(['fokasStickyNote'], (res) => {
    if (res.fokasStickyNote) {
      const data = res.fokasStickyNote;
      stickyText.value = data.content || '';
      activeColor = data.color || '#ffe08a';
      activeFont = data.fontFamily || "'Inter', sans-serif";
      activeSize = data.fontSize || '15px';

      fontFamilySelect.value = activeFont;
      fontSizeSelect.value = activeSize;
      customColorPicker.value = activeColor;
      applyStyles();
    }
  });

  function applyStyles() {
    previewBox.style.background = activeColor;
    stickyText.style.fontFamily = activeFont;
    stickyText.style.fontSize = activeSize;
    const isDarkBg = isColorDark(activeColor);
    stickyText.style.color = isDarkBg ? '#f0f0f0' : '#2b2410';

    saveStickyState();
  }

  function isColorDark(hex) {
    if (!hex || hex[0] !== '#') return false;
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 120;
  }

  function saveStickyState() {
    chrome.storage.local.set({
      fokasStickyNote: {
        content: stickyText.value,
        color: activeColor,
        fontFamily: activeFont,
        fontSize: activeSize
      }
    });
  }

  document.querySelectorAll('.swatches .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.swatches .swatch').forEach(x => x.classList.remove('active'));
      sw.classList.add('active');
      activeColor = sw.dataset.c;
      customColorPicker.value = activeColor;
      applyStyles();
    });
  });

  customColorPicker.addEventListener('input', (e) => {
    document.querySelectorAll('.swatches .swatch').forEach(x => x.classList.remove('active'));
    activeColor = e.target.value;
    applyStyles();
  });

  fontFamilySelect.addEventListener('change', (e) => {
    activeFont = e.target.value;
    applyStyles();
  });

  fontSizeSelect.addEventListener('change', (e) => {
    activeSize = e.target.value;
    applyStyles();
  });

  stickyText.addEventListener('input', saveStickyState);

  stickyToggleMini.addEventListener('click', () => {
    isMiniMode = !isMiniMode;
    stickyToggleMini.textContent = isMiniMode ? '📐 Standard View' : '🔍 Mini Floating View';
    stickyToggleMini.style.borderColor = isMiniMode ? 'var(--amber)' : 'var(--line)';
    stickyStatus.textContent = isMiniMode ? 'Mini mode active: Floating window will shrink to ultra-compact widget!' : '';
  });

  stickyLaunchPip.addEventListener('click', async () => {
    if (!('documentPictureInPicture' in window)) {
      stickyStatus.style.color = 'var(--red)';
      stickyStatus.textContent = "Floating Picture-in-Picture window is supported in Chrome/Edge desktop.";
      return;
    }

    try {
      const width = isMiniMode ? 200 : 300;
      const height = isMiniMode ? 140 : 280;

      const pipWindow = await documentPictureInPicture.requestWindow({ width, height });

      const isDarkBg = isColorDark(activeColor);
      const textColor = isDarkBg ? '#f0f0f0' : '#2b2410';
      const subColor = isDarkBg ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Fira+Code:wght@400;600&family=Inter:wght@400;600&family=Playfair+Display:ital,wght@0,600;1,400&family=Poppins:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
        body {
          background: ${activeColor};
          color: ${textColor};
          display: flex;
          flex-direction: column;
          font-family: ${activeFont};
          user-select: none;
          overflow: hidden;
        }
        .pip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${subColor};
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .pip-header .mini-btn {
          cursor: pointer;
          font-size: 12px;
          background: none;
          border: none;
          color: inherit;
          opacity: 0.8;
        }
        .pip-header .mini-btn:hover { opacity: 1; }
        textarea {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          padding: 10px 12px;
          font-size: ${activeSize};
          font-family: ${activeFont};
          color: ${textColor};
          outline: none;
          line-height: 1.45;
        }
      `;
      pipWindow.document.head.appendChild(style);

      pipWindow.document.body.innerHTML = `
        <div class="pip-header">
          <span>📌 fokas note</span>
          <div>
            <button class="mini-btn" id="pipResize" title="Toggle Mini Size">🔍</button>
            <span id="pipClock"></span>
          </div>
        </div>
        <textarea id="pipNoteArea" placeholder="Write here...">${stickyText.value}</textarea>
      `;

      const pipNoteArea = pipWindow.document.getElementById('pipNoteArea');
      const pipClock = pipWindow.document.getElementById('pipClock');
      const pipResize = pipWindow.document.getElementById('pipResize');

      pipNoteArea.addEventListener('input', () => {
        stickyText.value = pipNoteArea.value;
        saveStickyState();
      });

      const updateClock = () => {
        pipClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      updateClock();
      const clockInt = setInterval(updateClock, 30000);

      let pipMiniToggle = isMiniMode;
      pipResize.addEventListener('click', () => {
        pipMiniToggle = !pipMiniToggle;
        if (pipMiniToggle) {
          pipWindow.resizeTo(200, 140);
        } else {
          pipWindow.resizeTo(300, 280);
        }
      });

      pipWindow.addEventListener('pagehide', () => clearInterval(clockInt));

      stickyStatus.style.color = 'var(--teal)';
      stickyStatus.textContent = 'Frameless floating sticky note opened! Drag & resize freely.';
    } catch (err) {
      stickyStatus.style.color = 'var(--red)';
      stickyStatus.textContent = 'Could not open PIP window: ' + err.message;
    }
  });
}

function initFocusMode() {
  const focusMin = document.getElementById('focusMin');
  const focusFace = document.getElementById('focusFace');
  const focusDot = document.getElementById('focusDot');
  const focusLabel = document.getElementById('focusLabel');
  const focusStart = document.getElementById('focusStart');
  const focusStop = document.getElementById('focusStop');
  const strikeCount = document.getElementById('strikeCount');
  const focusCatAvatar = document.getElementById('focusCatAvatar');

  let focusActive = false;
  let focusRemaining = 25 * 60;
  let focusInterval = null;

  chrome.runtime.sendMessage({ action: 'GET_FOCUS_STATE' }, (state) => {
    if (state && state.active) {
      focusActive = true;
      focusDot.classList.add('live');
      focusLabel.textContent = 'Fokas mode is LIVE 🐾';
      strikeCount.textContent = `Drifts Caught: ${state.strikes || 0}`;
    }
  });

  focusMin.addEventListener('input', (e) => {
    if (!focusActive) {
      focusRemaining = Math.max(1, parseInt(e.target.value) || 25) * 60;
      focusFace.textContent = fmt(focusRemaining, false);
    }
  });

  focusFace.textContent = fmt(focusRemaining, false);

  focusStart.addEventListener('click', () => {
    if (focusActive) return;

    const min = Math.max(1, parseInt(focusMin.value) || 25);
    focusRemaining = min * 60;
    focusActive = true;

    focusDot.classList.add('live');
    focusLabel.textContent = 'Fokas mode is LIVE 🐾';
    focusCatAvatar.src = '../assets/cat_normal.svg';

    const selectedCheckboxes = document.querySelectorAll('#frontMultiTabList input[type="checkbox"]:checked');
    const allowedTabIds = Array.from(selectedCheckboxes).map(c => parseInt(c.dataset.tabId));
    const primaryTabId = allowedTabIds[0] || null;

    chrome.runtime.sendMessage({
      action: 'START_FOCUS_MODE',
      tabId: primaryTabId,
      allowedTabIds: allowedTabIds,
      durationSec: focusRemaining
    });

    focusInterval = setInterval(() => {
      focusRemaining -= 1;
      focusFace.textContent = fmt(focusRemaining, false);
      if (focusRemaining <= 0) {
        stopFocus();
        focusLabel.textContent = 'Session complete! 🎉';
        playAlertChime();
      }
    }, 1000);
  });

  focusStop.addEventListener('click', stopFocus);

  function stopFocus() {
    focusActive = false;
    clearInterval(focusInterval);
    focusDot.classList.remove('live');
    focusLabel.textContent = 'Fokas mode is OFF';
    focusCatAvatar.src = '../assets/cat_normal.svg';

    chrome.runtime.sendMessage({ action: 'STOP_FOCUS_MODE' });
  }
}
