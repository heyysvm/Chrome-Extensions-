(function () {
  let lastText = '';
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
    if (!text || text === lastText) return;
    lastText = text;

    try {
      chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: text }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res && res.status === 'added') {
          showToast('Saved to Clipbod');
        }
      });
    } catch (e) {}
  }

  function handleCopyEvent(e) {
    let text = '';
    if (e && e.clipboardData && typeof e.clipboardData.getData === 'function') {
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
      sendClip(text);
    } else {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) sendClip(sel.toString());
      }, 30);
    }
  }

  document.addEventListener('copy', handleCopyEvent, true);
  document.addEventListener('cut', handleCopyEvent, true);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'c') {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) sendClip(sel.toString());
      }, 40);
    }
  }, true);
})();
