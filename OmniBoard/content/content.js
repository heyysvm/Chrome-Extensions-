(function () {
  let toastTimeout = null;

  function showToast(msg) {
    let toast = document.getElementById('omni-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'omni-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  document.addEventListener('copy', (e) => {
    let copiedText = '';
    
    if (e.clipboardData && typeof e.clipboardData.getData === 'function') {
      copiedText = e.clipboardData.getData('text/plain');
    }
    
    if (!copiedText) {
      const sel = window.getSelection();
      if (sel) copiedText = sel.toString();
    }

    if (!copiedText || !copiedText.trim()) {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim()) {
          chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: sel.toString() }, (res) => {
            if (res && res.status === 'added') {
              showToast('📋 Saved to OmniBoard');
            }
          });
        }
      }, 50);
      return;
    }

    if (copiedText && copiedText.trim().length > 0) {
      chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: copiedText }, (res) => {
        if (res && res.status === 'added') {
          showToast('📋 Saved to OmniBoard');
        }
      });
    }
  });
})();
