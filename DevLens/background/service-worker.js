chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['devPalette', 'devNotes', 'quizScore'], (res) => {
    if (!res.devPalette) {
      chrome.storage.local.set({
        devPalette: [
          { hex: '#0f172a', name: 'Slate Dark', tag: 'Background' },
          { hex: '#38bdf8', name: 'Electric Cyan', tag: 'Accent' },
          { hex: '#818cf8', name: 'Indigo Glow', tag: 'Accent' },
          { hex: '#22c55e', name: 'Emerald Success', tag: 'Status' }
        ],
        devNotes: '// DevLens Scratchpad\nconst greeting = "Build awesome software!";\nconsole.log(greeting);',
        quizScore: 0
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_COLOR') {
    chrome.storage.local.get(['devPalette'], (res) => {
      let palette = res.devPalette || [];
      const exists = palette.some(c => c.hex.toLowerCase() === request.color.hex.toLowerCase());
      if (!exists) {
        palette.unshift(request.color);
        if (palette.length > 50) palette = palette.slice(0, 50);
        chrome.storage.local.set({ devPalette: palette }, () => {
          sendResponse({ status: 'saved', palette });
        });
      } else {
        sendResponse({ status: 'exists' });
      }
    });
    return true;
  }

  if (request.action === 'GET_DATA') {
    chrome.storage.local.get(['devPalette', 'devNotes', 'quizScore'], (res) => {
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'TOGGLE_INSPECTOR') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_INSPECTOR_OVERLAY' }).catch(() => {});
      }
    });
    sendResponse({ status: 'toggled' });
    return true;
  }
});
