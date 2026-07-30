let nagTimer = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['fokasFocusState', 'fokasStickyNote'], (res) => {
    if (!res.fokasFocusState) {
      chrome.storage.local.set({
        fokasFocusState: {
          active: false,
          targetWindowId: null,
          targetTabId: null,
          allowedTabIds: [],
          allowedDomains: [],
          remainingSec: 25 * 60,
          strikes: 0,
          startTime: 0
        }
      });
    }
    if (!res.fokasStickyNote) {
      chrome.storage.local.set({
        fokasStickyNote: {
          content: '',
          color: '#ffe08a',
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: '400'
        }
      });
    }
  });
});

async function playOffscreenAlarm(customSoundFile) {
  try {
    const data = await chrome.storage.local.get(['fokasSelectedSound']);
    const chosenSound = customSoundFile || data.fokasSelectedSound || 'ios_sos_alarm.wav';

    const existing = await chrome.offscreen.hasDocument();
    if (!existing) {
      await chrome.offscreen.createDocument({
        url: 'offscreen/offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play emergency alarm MP3 tone when focus mode is violated'
      });
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const sendMsg = () => {
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_PLAY_ALARM', soundFile: chosenSound }, (res) => {
        if (chrome.runtime.lastError || !res) {
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'OFFSCREEN_PLAY_ALARM', soundFile: chosenSound }).catch(() => {});
          }, 200);
        }
      });
    };

    sendMsg();
  } catch (err) {
    console.log('Offscreen audio error:', err);
  }
}

async function stopOffscreenAlarm() {
  try {
    const existing = await chrome.offscreen.hasDocument();
    if (existing) {
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_STOP_ALARM' });
      await chrome.offscreen.closeDocument();
    }
  } catch (err) {}
}

function showViolationNotification() {
  try {
    chrome.notifications.create('fokas_violation_notice', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icon128.png'),
      title: 'BAND KRRR BSDKS!! 🚫 🤬',
      message: 'Fokas mode caught you drifting! Get back to your focus session right now! 😡',
      priority: 2,
      requireInteraction: true
    });
  } catch (err) {
    console.log('Notification error:', err);
  }
}

function clearViolationNotification() {
  try {
    chrome.notifications.clear('fokas_violation_notice');
  } catch (err) {}
}

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'fokas_violation_notice') {
    chrome.windows.getCurrent((win) => {
      if (win && win.id) {
        chrome.windows.update(win.id, { focused: true });
      }
    });
  }
});

function clearNagTimer() {
  if (nagTimer) {
    clearTimeout(nagTimer);
    nagTimer = null;
  }
}

function isTabAllowed(tab, focusState) {
  if (!focusState || !focusState.active) return true;
  if (!tab || !tab.id) return false;

  const currentTabId = Number(tab.id);

  if (focusState.targetTabId && Number(focusState.targetTabId) === currentTabId) return true;

  if (Array.isArray(focusState.allowedTabIds) && focusState.allowedTabIds.length > 0) {
    if (focusState.allowedTabIds.map(Number).includes(currentTabId)) return true;
  }

  return false;
}

async function forceRestoreFocus() {
  clearNagTimer();
  await stopOffscreenAlarm();
  clearViolationNotification();
}

async function ensureContentScriptInjected(tabId, url) {
  if (!tabId || !url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) return;

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['content/cat_widget.css']
    });
  } catch (e) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/cat_widget.js']
    });
  } catch (e) {}
}

async function checkFocusViolation() {
  const data = await chrome.storage.local.get(['fokasFocusState']);
  const focusState = data.fokasFocusState;

  if (!focusState || !focusState.active) {
    await forceRestoreFocus();
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'HIDE_VIOLATION_BANNER' }).catch(() => {});
      }
    } catch (e) {}
    return;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (activeTab && !isTabAllowed(activeTab, focusState)) {
    focusState.strikes = (focusState.strikes || 0) + 1;
    await chrome.storage.local.set({ fokasFocusState: focusState });

    await playOffscreenAlarm();
    showViolationNotification();

    if (activeTab.id) {
      await ensureContentScriptInjected(activeTab.id, activeTab.url);
      chrome.tabs.sendMessage(activeTab.id, { action: 'SHOW_VIOLATION_BANNER', state: focusState }).catch(() => {});
    }
  } else if (activeTab && isTabAllowed(activeTab, focusState)) {
    await forceRestoreFocus();
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action: 'HIDE_VIOLATION_BANNER' }).catch(() => {});
    }
  }
}

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const data = await chrome.storage.local.get(['fokasFocusState']);
  const focusState = data.fokasFocusState;

  if (focusState && focusState.active) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      focusState.strikes = (focusState.strikes || 0) + 1;
      await chrome.storage.local.set({ fokasFocusState: focusState });

      await playOffscreenAlarm();
      showViolationNotification();
    } else {
      await checkFocusViolation();
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const data = await chrome.storage.local.get(['fokasFocusState']);
  const focusState = data.fokasFocusState;

  if (focusState && focusState.active) {
    if (isTabAllowed({ id: activeInfo.tabId }, focusState)) {
      await forceRestoreFocus();
      chrome.tabs.sendMessage(activeInfo.tabId, { action: 'HIDE_VIOLATION_BANNER' }).catch(() => {});
    } else {
      clearNagTimer();
      await checkFocusViolation();
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const data = await chrome.storage.local.get(['fokasFocusState']);
    const focusState = data.fokasFocusState;
    if (focusState && focusState.active && tab.active) {
      await checkFocusViolation();
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_FOCUS_MODE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeTab = activeTabs[0];
      const activeTabId = activeTab ? activeTab.id : null;
      
      const targetTabId = request.tabId || activeTabId;
      let allowedTabIds = Array.isArray(request.allowedTabIds) && request.allowedTabIds.length > 0 
        ? request.allowedTabIds 
        : [targetTabId];

      if (targetTabId && !allowedTabIds.includes(targetTabId)) {
        allowedTabIds.push(targetTabId);
      }

      chrome.windows.getCurrent((currentWin) => {
        const windowId = currentWin ? currentWin.id : null;

        chrome.storage.local.set({
          fokasFocusState: {
            active: true,
            targetWindowId: windowId,
            targetTabId: targetTabId,
            allowedTabIds: allowedTabIds,
            remainingSec: request.durationSec || 25 * 60,
            strikes: 0,
            startTime: Date.now()
          }
        }, async () => {
          await forceRestoreFocus();
          await checkFocusViolation();
          sendResponse({ status: 'ok' });
        });
      });
    });
    return true;
  }

  if (request.action === 'STOP_FOCUS_MODE') {
    forceRestoreFocus();
    chrome.storage.local.get(['fokasFocusState'], (res) => {
      const state = res.fokasFocusState || {};
      state.active = false;
      chrome.storage.local.set({ fokasFocusState: state }, async () => {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'HIDE_VIOLATION_BANNER' }).catch(() => {});
        }
        sendResponse({ status: 'ok' });
      });
    });
    return true;
  }

  if (request.action === 'USER_ACKNOWLEDGED_TEMP') {
    stopOffscreenAlarm();
    clearNagTimer();

    nagTimer = setTimeout(async () => {
      await checkFocusViolation();
    }, 10000);

    sendResponse({ status: 'timer_started' });
    return true;
  }

  if (request.action === 'RESTORE_FOCUS') {
    forceRestoreFocus();
    sendResponse({ status: 'ok' });
    return true;
  }

  if (request.action === 'GET_OPEN_TABS') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse(tabs.map(t => ({ id: t.id, title: t.title || t.url, url: t.url, active: t.active })));
    });
    return true;
  }

  if (request.action === 'GET_FOCUS_STATE') {
    chrome.storage.local.get(['fokasFocusState'], (res) => {
      sendResponse(res.fokasFocusState || { active: false });
    });
    return true;
  }

  if (request.action === 'SWITCH_TO_WHITELISTED_TAB') {
    chrome.storage.local.get(['fokasFocusState'], async (res) => {
      const focusState = res.fokasFocusState;
      if (focusState && focusState.active) {
        const targetId = focusState.targetTabId || (focusState.allowedTabIds && focusState.allowedTabIds[0]);
        if (targetId) {
          try {
            await chrome.tabs.update(targetId, { active: true });
          } catch (e) {}
        }
      }
      await forceRestoreFocus();
      sendResponse({ status: 'ok' });
    });
    return true;
  }

  if (request.action === 'CHECK_CURRENT_TAB_STATUS') {
    chrome.storage.local.get(['fokasFocusState'], async (res) => {
      const focusState = res.fokasFocusState;
      if (!focusState || !focusState.active) {
        sendResponse({ isViolating: false });
        return;
      }
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && sender.tab && activeTab.id === sender.tab.id) {
        const allowed = isTabAllowed(activeTab, focusState);
        sendResponse({ isViolating: !allowed });
      } else {
        sendResponse({ isViolating: false });
      }
    });
    return true;
  }
});
