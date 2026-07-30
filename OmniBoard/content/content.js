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
    }, 2000);
  }

  document.addEventListener('copy', () => {
    setTimeout(async () => {
      try {
        const selection = window.getSelection().toString();
        if (selection && selection.trim().length > 0) {
          chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: selection }, (res) => {
            if (res && res.status === 'added') {
              showToast('📋 Saved to OmniBoard');
            }
          });
        }
      } catch (e) {}
    }, 50);
  });
})();
