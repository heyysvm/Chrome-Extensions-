document.addEventListener('DOMContentLoaded', () => {
  let allClips = [];
  let currentFilter = 'all';
  let searchQuery = '';

  const clipList = document.getElementById('clipList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const addManualBtn = document.getElementById('addManualBtn');
  const clipCount = document.getElementById('clipCount');
  const clearUnpinnedBtn = document.getElementById('clearUnpinnedBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const launchPipBtn = document.getElementById('launchPipBtn');
  const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
  const transformBtns = document.querySelectorAll('.transform-btn');

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

  function loadClips() {
    chrome.storage.local.get(['omniClips'], (res) => {
      allClips = (res && res.omniClips) ? res.omniClips : [];
      renderClips();
    });
  }

  function syncClipboardOnOpen() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        if (!text || !text.trim()) return;
        const clean = text.trim();
        chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: clean }, () => {
          loadClips();
        });
      }).catch(() => {});
    }
  }

  // Real-time Storage Listener - Unconditional Reload & Render
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadClips();
    }
  });

  // Real-time Runtime Message Listener
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'CLIP_UPDATED') {
      loadClips();
    }
  });

  // Poll fallback every 800ms
  setInterval(loadClips, 800);

  function formatTime(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToastNotification('Copied to Clipboard');
    }).catch(() => {});
  }

  function showToastNotification(msg) {
    let toast = document.getElementById('popup-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'popup-toast';
      toast.style.cssText = `
        position: fixed; bottom: 45px; left: 50%; transform: translateX(-50%);
        background: rgba(56, 189, 248, 0.95); color: #0f172a;
        padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index: 9999; opacity: 0; transition: opacity 0.2s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 1500);
  }

  function renderClips() {
    clipList.innerHTML = '';

    let filtered = allClips.filter(c => {
      if (currentFilter === 'pinned') return c.pinned;
      if (currentFilter !== 'all') return c.type === currentFilter;
      return true;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.text.toLowerCase().includes(q));
    }

    clipCount.textContent = `${filtered.length} clips in storage`;

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      clipList.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    clipList.style.display = 'flex';

    filtered.forEach(clip => {
      const card = document.createElement('div');
      card.className = `clip-card ${clip.pinned ? 'pinned' : ''}`;

      const isCodeOrJson = clip.type === 'code' || clip.type === 'json';
      const isColor = clip.type === 'color';

      let bodyContent = `<div class="clip-body ${isCodeOrJson ? 'code-font' : ''}">${escapeHtml(clip.text)}</div>`;
      if (isColor) {
        bodyContent = `
          <div class="color-preview-bar">
            <div class="color-dot" style="background:${clip.text};"></div>
            <div class="clip-body code-font">${escapeHtml(clip.text)}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="clip-header">
          <span class="type-badge ${clip.type}">${clip.type}</span>
          <span class="clip-time">${formatTime(clip.timestamp)}</span>
        </div>
        ${bodyContent}
        <div class="clip-actions">
          <button class="action-icon-btn copy" title="Copy item to Clipboard">Copy Item</button>
          <button class="action-icon-btn pin ${clip.pinned ? 'active' : ''}" title="${clip.pinned ? 'Unpin' : 'Pin'}">${clip.pinned ? 'Pinned' : 'Pin'}</button>
          <button class="action-icon-btn delete" title="Delete Clip">Delete</button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.clip-actions')) return;
        copyToClipboard(clip.text);
      });

      card.querySelector('.copy').addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(clip.text);
      });

      card.querySelector('.pin').addEventListener('click', (e) => {
        e.stopPropagation();
        togglePin(clip.id);
      });

      card.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteClip(clip.id);
      });

      clipList.appendChild(card);
    });
  }

  function togglePin(id) {
    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      clips = clips.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
      chrome.storage.local.set({ omniClips: clips }, loadClips);
    });
  }

  function deleteClip(id) {
    chrome.storage.local.get(['omniClips'], (res) => {
      let clips = res.omniClips || [];
      clips = clips.filter(c => c.id !== id);
      chrome.storage.local.set({ omniClips: clips }, loadClips);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  filterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderClips();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderClips();
  });

  addManualBtn.addEventListener('click', () => {
    const text = searchInput.value.trim();
    if (!text) return;
    chrome.runtime.sendMessage({ action: 'ADD_CLIP', text }, () => {
      searchInput.value = '';
      searchQuery = '';
      loadClips();
      showToastNotification('Clip Saved');
    });
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addManualBtn.click();
    }
  });

  if (clearUnpinnedBtn) {
    clearUnpinnedBtn.addEventListener('click', () => {
      chrome.storage.local.get(['omniClips'], (res) => {
        let clips = res.omniClips || [];
        clips = clips.filter(c => c.pinned);
        chrome.storage.local.set({ omniClips: clips }, loadClips);
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      chrome.storage.local.set({ omniClips: [] }, loadClips);
    });
  }

  transformBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.transform;
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        let transformed = text;
        if (type === 'strip') {
          transformed = text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        } else if (type === 'uppercase') {
          transformed = text.toUpperCase();
        } else if (type === 'lowercase') {
          transformed = text.toLowerCase();
        } else if (type === 'titlecase') {
          transformed = text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        } else if (type === 'json') {
          try {
            const parsed = JSON.parse(text);
            transformed = JSON.stringify(parsed, null, 2);
          } catch (e) {
            showToastNotification('Invalid JSON');
            return;
          }
        } else if (type === 'ai_refactor') {
          transformed = `Refactor and optimize the following code for performance, readability, and best practices:\n\n\`\`\`\n${text}\n\`\`\``;
        } else if (type === 'ai_summarize') {
          transformed = `Provide a concise 3-bullet summary of the following text:\n\n"${text}"`;
        }

        chrome.runtime.sendMessage({ action: 'ADD_CLIP', text: transformed }, () => {
          copyToClipboard(transformed);
          loadClips();
        });
      } catch (err) {
        showToastNotification('Could not read clipboard');
      }
    });
  });

  launchPipBtn.addEventListener('click', async () => {
    if (!('documentPictureInPicture' in window)) {
      showToastNotification('PIP Window supported in Chrome/Edge Desktop');
      return;
    }

    try {
      const pipWindow = await documentPictureInPicture.requestWindow({ width: 360, height: 480 });

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700;800&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
        body {
          background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column; overflow: hidden; user-select: none;
        }
        .pip-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; background: rgba(15,23,42,0.95); border-bottom: 1px solid rgba(255,255,255,0.08);
          font-size: 13px; font-weight: 800; color: #38bdf8;
        }
        .pip-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .pip-card {
          background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 8px 10px; cursor: pointer; transition: background 0.2s; position: relative;
        }
        .pip-card:hover { background: rgba(51, 65, 85, 0.9); }
        .pip-card-text { font-size: 11px; word-break: break-word; max-height: 50px; overflow: hidden; color: #f8fafc; }
        .pip-card-type { font-size: 9px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 4px; }
        .pip-card-actions { display: flex; gap: 8px; margin-top: 6px; justify-content: flex-end; }
        .pip-btn { background: none; border: none; color: #94a3b8; font-size: 11px; cursor: pointer; }
        .pip-btn:hover { color: #f8fafc; }
      `;
      pipWindow.document.head.appendChild(style);

      pipWindow.document.body.innerHTML = `
        <div class="pip-header">
          <span>Clipbod Floating</span>
        </div>
        <div class="pip-list" id="pipList"></div>
      `;

      const renderPipList = () => {
        chrome.storage.local.get(['omniClips'], (res) => {
          const listEl = pipWindow.document.getElementById('pipList');
          if (!listEl) return;
          listEl.innerHTML = '';
          const clips = (res && res.omniClips) ? res.omniClips : [];
          clips.forEach(c => {
            const card = pipWindow.document.createElement('div');
            card.className = 'pip-card';
            card.innerHTML = `
              <div class="pip-card-type">${c.type}</div>
              <div class="pip-card-text">${escapeHtml(c.text)}</div>
              <div class="pip-card-actions">
                <button class="pip-btn pip-copy">Copy Item</button>
                <button class="pip-btn pip-del">Delete</button>
              </div>
            `;

            card.querySelector('.pip-copy').addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(c.text);
              card.querySelector('.pip-copy').textContent = 'Copied!';
              setTimeout(() => { card.querySelector('.pip-copy').textContent = 'Copy Item'; }, 1200);
            });

            card.querySelector('.pip-del').addEventListener('click', (e) => {
              e.stopPropagation();
              deleteClip(c.id);
            });

            listEl.appendChild(card);
          });
        });
      };

      renderPipList();
      const storageListener = (changes, area) => {
        if (area === 'local') {
          renderPipList();
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
      pipWindow.addEventListener('pagehide', () => chrome.storage.onChanged.removeListener(storageListener));
    } catch (err) {
      showToastNotification('Could not open PIP Window');
    }
  });

  loadClips();
  syncClipboardOnOpen();
});
