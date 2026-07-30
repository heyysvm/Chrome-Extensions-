// Background service worker for Internet Memory Chrome Extension

// Configure side panel behavior on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Internet Memory extension installed.');
  
  // Set panel behavior to open sidepanel on action icon click
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.error('Failed to set side panel behavior:', err);
    });
  }

  // Create context menu item
  chrome.contextMenus.create({
    id: 'index-current-page',
    title: 'Index page with Internet Memory',
    contexts: ['page']
  });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'index-current-page' && tab?.id) {
    startIndexing(tab.id, tab.url || '', tab.title || '');
  }
});

// Listen for tab updates to auto-index pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Check privacy settings before auto-indexing
    chrome.storage.local.get(['excludedWebsites', 'incognitoIndexing'], (settings) => {
      const excludedList: string[] = settings.excludedWebsites || [];
      const urlObj = new URL(tab.url!);
      const isExcluded = excludedList.some(domain => urlObj.hostname.includes(domain));
      
      // Do not index private/banking websites
      const isSensitive = 
        urlObj.hostname.includes('bank') || 
        urlObj.hostname.includes('paypal') || 
        urlObj.hostname.includes('stripe') || 
        urlObj.hostname.includes('password') || 
        urlObj.hostname.includes('checkout');

      if (isExcluded || isSensitive) {
        console.log(`Skipping auto-indexing for excluded or sensitive page: ${tab.url}`);
        return;
      }

      if (tab.incognito && !settings.incognitoIndexing) {
        console.log('Skipping indexing for incognito tab (incognitoIndexing is disabled).');
        return;
      }

      // Trigger indexing after a brief debounce delay
      setTimeout(() => {
        startIndexing(tabId, tab.url!, tab.title || '');
      }, 1500);
    });
  }
});

// Main indexing function
function startIndexing(tabId: number, url: string, title: string) {
  console.log(`Starting indexing for tab: ${tabId}, url: ${url}`);
  
  // Request DOM content extraction from content script
  chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_DOM' }, (response) => {
    // If runtime error or no response, the content script might not be loaded yet
    if (chrome.runtime.lastError || !response) {
      console.warn(`Content script not ready on tab ${tabId}. Error:`, chrome.runtime.lastError?.message);
      return;
    }

    const { textContent, favicon } = response;
    
    // Clean and package payload
    const payload = {
      url,
      title,
      favicon,
      rawText: textContent,
      timestamp: new Date().toISOString()
    };

    // Store in storage local cache for testing
    chrome.storage.local.get(['indexingQueue'], (data) => {
      const queue = data.indexingQueue || [];
      // Prevent duplicates in local queue
      const filteredQueue = queue.filter((item: any) => item.url !== url);
      filteredQueue.push(payload);
      
      chrome.storage.local.set({ indexingQueue: filteredQueue }, () => {
        console.log(`Page cached in local indexing queue: ${title}`);
        
        // Notify popup and sidepanel of new indexed page
        chrome.runtime.sendMessage({ 
          action: 'PAGE_INDEXED', 
          page: {
            id: String(Math.random()),
            url,
            title,
            favicon,
            createdAt: new Date().toISOString(),
            isPinned: false,
            isBookmarked: false,
            collectionIds: []
          }
        }).catch(() => {
          // Ignore error if popup/sidepanel is closed and not listening
        });
      });
    });

    // Upload indexed content to Express backend API
    sendToServer(payload);
  });
}

// Upload dynamic content payloads to Backend server
function sendToServer(payload: any) {
  chrome.storage.local.get(['token', 'gemini_api_key', 'backend_url'], (settings) => {
    const token = settings.token;
    if (!token) {
      console.warn('Skipping API upload: No token saved in extension storage.');
      return;
    }

    const baseUrl = settings.backend_url || 'http://localhost:5000';
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    if (settings.gemini_api_key) {
      headers['x-gemini-api-key'] = settings.gemini_api_key;
    }

    fetch(`${baseUrl}/api/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        favicon: payload.favicon,
        cleanedContent: payload.rawText
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('API server returned error status ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('Successfully uploaded page index to backend:', data.title);
    })
    .catch(err => {
      console.error('Failed to post page index to server:', err);
    });
  });
}

// Listen for messages from popup or sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'GET_QUEUE') {
    chrome.storage.local.get(['indexingQueue'], (data) => {
      sendResponse({ queue: data.indexingQueue || [] });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'CLEAR_QUEUE') {
    chrome.storage.local.set({ indexingQueue: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'INDEX_NOW') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id && tabs[0]?.url?.startsWith('http')) {
        startIndexing(tabs[0].id, tabs[0].url, tabs[0].title || '');
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active web tab' });
      }
    });
    return true;
  }
});
