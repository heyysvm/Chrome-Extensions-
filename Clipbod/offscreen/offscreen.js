let lastClipText = '';
const pasteBuffer = document.getElementById('pasteBuffer');

function checkSystemClipboard() {
  try {
    pasteBuffer.value = '';
    pasteBuffer.focus();
    document.execCommand('paste');
    const text = pasteBuffer.value;
    if (text && text.trim() && text !== lastClipText) {
      lastClipText = text;
      chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: text.trim() });
    }
  } catch (e) {}

  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      if (text && text.trim() && text !== lastClipText) {
        lastClipText = text;
        chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: text.trim() });
      }
    }).catch(() => {});
  }
}

setInterval(checkSystemClipboard, 800);
