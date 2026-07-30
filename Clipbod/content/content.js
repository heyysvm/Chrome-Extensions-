(function () {
  let activeSelectionText = '';
  let lastCapturedText = '';
  let toastTimeout = null;

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
    }, 1500);
  }

  function sendClip(rawText) {
    if (!rawText) return;
    const text = rawText.trim();
    if (!text || text.length === 0 || text === lastCapturedText) return;
    lastCapturedText = text;

    try {
      chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: text }, (res) => {
        if (chrome.runtime.lastError) return;
        showToast('Saved to Clipbod');
      });
    } catch (e) {}
  }

  document.addEventListener('selectionchange', () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) {
        activeSelectionText = sel.toString().trim();
      }
    } catch (e) {}
  }, true);

  function getBestText(e) {
    let text = '';
    if (e && e.clipboardData && typeof e.clipboardData.getData === 'function') {
      try { text = e.clipboardData.getData('text/plain'); } catch(err) {}
    }
    if (!text && activeSelectionText) {
      text = activeSelectionText;
    }
    if (!text) {
      try {
        const sel = window.getSelection();
        if (sel) text = sel.toString();
      } catch (err) {}
    }
    if (!text && document.activeElement) {
      const el = document.activeElement;
      if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && typeof el.selectionStart === 'number') {
        text = el.value.substring(el.selectionStart, el.selectionEnd);
      }
    }
    return text;
  }

  document.addEventListener('copy', (e) => {
    const text = getBestText(e);
    if (text) sendClip(text);
    setTimeout(() => {
      const fallbackText = getBestText(e);
      if (fallbackText) sendClip(fallbackText);
    }, 50);
  }, true);

  document.addEventListener('cut', (e) => {
    const text = getBestText(e);
    if (text) sendClip(text);
  }, true);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'c') {
      const text = getBestText(e);
      if (text) sendClip(text);
      setTimeout(() => {
        const textLate = getBestText(e);
        if (textLate) sendClip(textLate);
      }, 50);
    }
  }, true);
})();
