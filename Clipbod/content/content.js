(function () {
  let toastTimeout = null;
  let lastCapturedText = '';

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

  function captureAndSave(text) {
    if (!text) return;
    const clean = text.trim();
    if (!clean || clean === lastCapturedText) return;
    
    lastCapturedText = clean;
    chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: clean }, (res) => {
      if (res && res.status === 'added') {
        showToast('Saved to Clipbod');
      }
    });
  }

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
      captureAndSave(text);
    } else {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) captureAndSave(sel.toString());
      }, 40);
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString()) {
          captureAndSave(sel.toString());
        }
      }, 50);
    }
  }, true);
})();
