(function () {
  if (window.__clipbod_injected) return;
  window.__clipbod_injected = true;

  let toastTimeout = null;
  let lastSavedText = '';

  function showToast(msg) {
    let toast = document.getElementById('clipbod-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'clipbod-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

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

  function saveClipDirect(rawText) {
    if (!rawText) return;
    const text = rawText.trim();
    if (!text || text === lastSavedText) return;
    lastSavedText = text;

    try {
      chrome.storage.local.get(['omniClips'], (res) => {
        let clips = (res && res.omniClips) ? res.omniClips : [];
        if (clips.length > 0 && clips[0].text === text) return;

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
          showToast('Saved to Clipbod');
        });
      });
    } catch (e) {
      chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: text });
    }
  }

  // Listener 1: Copy event
  document.addEventListener('copy', (e) => {
    let text = '';
    if (e.clipboardData && typeof e.clipboardData.getData === 'function') {
      text = e.clipboardData.getData('text/plain');
    }
    if (!text) {
      const sel = window.getSelection();
      if (sel) text = sel.toString();
    }
    if (!text && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      const el = document.activeElement;
      if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
        text = el.value.substring(el.selectionStart, el.selectionEnd);
      }
    }

    if (text) {
      saveClipDirect(text);
    } else {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) saveClipDirect(sel.toString());
      }, 40);
    }
  }, true);

  // Listener 2: Cut event
  document.addEventListener('cut', (e) => {
    let text = '';
    if (e.clipboardData && typeof e.clipboardData.getData === 'function') {
      text = e.clipboardData.getData('text/plain');
    }
    if (!text) {
      const sel = window.getSelection();
      if (sel) text = sel.toString();
    }
    if (text) saveClipDirect(text);
  }, true);

  // Listener 3: Keydown Ctrl+C / Cmd+C
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) {
          saveClipDirect(sel.toString());
        }
      }, 40);
    }
  }, true);
})();
