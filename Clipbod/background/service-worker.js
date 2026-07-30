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

function injectAllTabs() {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content/content.js']
      }).catch(() => {});
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/content.css']
      }).catch(() => {});
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  injectAllTabs();
  chrome.storage.local.get(['omniClips'], (res) => {
    if (!res.omniClips) {
      chrome.storage.local.set({
        omniClips: [
          {
            id: 'welcome_1',
            text: 'Welcome to Clipbod! Anything you copy on any website automatically saves here.',
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
  injectAllTabs();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ADD_CLIP') {
    const rawText = request.text;
    if (!rawText || !rawText.trim()) {
      sendResponse({ status: 'ignored' });
      return true;
    }

    const text = rawText.trim();

    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      
      if (clips.length > 0 && clips[0].text === text) {
        sendResponse({ status: 'duplicate' });
        return;
      }

      clips = clips.filter(c => c.text !== text);

      const newClip = {
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        text: text,
        type: detectType(text),
        timestamp: Date.now(),
        pinned: false
      };

      clips.unshift(newClip);
      if (clips.length > 300) clips = clips.slice(0, 300);

      chrome.storage.local.set({ omniClips: clips }, () => {
        chrome.runtime.sendMessage({ action: 'CLIP_UPDATED', clips: clips }).catch(() => {});
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
});
