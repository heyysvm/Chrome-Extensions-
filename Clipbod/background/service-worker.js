async function setupOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Continuously monitor system clipboard changes in real time for Clipbod'
    });
  } catch (e) {}
}

function injectScriptIntoTab(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    files: ['content/content.js']
  }).catch(() => {});
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['content/content.css']
  }).catch(() => {});
}

function injectAllTabs() {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) injectScriptIntoTab(tab.id);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupOffscreenDocument();
  injectAllTabs();

  chrome.storage.local.get(['omniClips'], (res) => {
    if (!res.omniClips) {
      chrome.storage.local.set({
        omniClips: [
          {
            id: 'welcome_1',
            text: 'Welcome to Clipbod! Anything you copy on any website or desktop app automatically saves here.',
            type: 'text',
            timestamp: Date.now(),
            pinned: true
          }
        ]
      });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  setupOffscreenDocument();
  injectAllTabs();
});

// Auto-inject when switching tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  injectScriptIntoTab(activeInfo.tabId);
});

// Auto-inject when navigating or loading tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
    injectScriptIntoTab(tabId);
  }
});

function detectType(text) {
  if (!text) return 'text';
  const trimmed = text.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return 'url';
  if (/^#(?:[0-9a-fA-F]{3}){1,2}$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(trimmed)) return 'color';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (e) {}
  }
  if (/\b(const|let|var|function|def|import|export|class|if|return|<html|<\/)\b/.test(trimmed)) return 'code';
  return 'text';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ADD_CLIP') {
    const rawText = request.text;
    if (!rawText || !rawText.trim()) {
      sendResponse({ status: 'ignored' });
      return true;
    }

    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      
      if (clips.length > 0 && clips[0].text === rawText) {
        sendResponse({ status: 'duplicate' });
        return;
      }

      clips = clips.filter(c => c.text !== rawText);

      const newClip = {
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        text: rawText,
        type: detectType(rawText),
        timestamp: Date.now(),
        pinned: false
      };

      clips.unshift(newClip);
      if (clips.length > 300) clips = clips.slice(0, 300);

      chrome.storage.local.set({ omniClips: clips }, () => {
        sendResponse({ status: 'added', clip: newClip });
      });
    });
    return true;
  }

  if (request.action === 'GET_CLIPS') {
    chrome.storage.local.get(['omniClips'], (res) => {
      sendResponse({ clips: res.omniClips || [] });
    });
    return true;
  }

  if (request.action === 'DELETE_CLIP') {
    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      clips = clips.filter(c => c.id !== request.id);
      chrome.storage.local.set({ omniClips: clips }, () => {
        sendResponse({ status: 'deleted' });
      });
    });
    return true;
  }

  if (request.action === 'TOGGLE_PIN') {
    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      clips = clips.map(c => c.id === request.id ? { ...c, pinned: !c.pinned } : c);
      chrome.storage.local.set({ omniClips: clips }, () => {
        sendResponse({ status: 'toggled' });
      });
    });
    return true;
  }

  if (request.action === 'CLEAR_CLIPS') {
    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      clips = clips.filter(c => c.pinned);
      chrome.storage.local.set({ omniClips: clips }, () => {
        sendResponse({ status: 'cleared' });
      });
    });
    return true;
  }

  if (request.action === 'CLEAR_ALL_FORCE') {
    chrome.storage.local.set({ omniClips: [] }, () => {
      sendResponse({ status: 'cleared_all' });
    });
    return true;
  }
});
