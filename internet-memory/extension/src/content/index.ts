// Content script for Internet Memory Chrome Extension

console.log('Internet Memory content script loaded.');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'EXTRACT_DOM') {
    const favicon = getFaviconUrl();
    const textContent = extractCleanText();
    
    sendResponse({
      textContent: textContent,
      favicon: favicon
    });
  }
  return true; // Keep message port active
});

// Helper function to extract and clean main webpage body text
function extractCleanText(): string {
  // Clone the document body so we don't mess up the actual user view
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Selectors for elements we want to purge
  const elementsToPurge = [
    'script',
    'style',
    'noscript',
    'iframe',
    'header',
    'footer',
    'nav',
    'aside',
    '.sidebar',
    '#sidebar',
    '.ads',
    '.advertisement',
    '#comments',
    '.comments',
    'svg',
    'form',
    'button'
  ];

  // Remove matching elements from our clone
  elementsToPurge.forEach((selector) => {
    bodyClone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Extract paragraphs, list items, and headers
  const textBlocks: string[] = [];
  const textSelectors = ['h1', 'h2', 'h3', 'p', 'li', 'article'];
  
  bodyClone.querySelectorAll(textSelectors.join(',')).forEach((el) => {
    const text = el.textContent?.trim();
    // Only capture substantial blocks of text to avoid layout remnants
    if (text && text.length > 25) {
      textBlocks.push(text);
    }
  });

  // If no structured selectors match, fallback to clean innerText lines
  if (textBlocks.length === 0) {
    const rawLines = bodyClone.innerText.split('\n');
    rawLines.forEach((line) => {
      const cleanLine = line.trim();
      if (cleanLine.length > 30) {
        textBlocks.push(cleanLine);
      }
    });
  }

  // Cap the text size (e.g. first 8,000 characters) to prevent excessive tokens
  return textBlocks.join('\n\n').slice(0, 15000);
}

// Helper function to locate favicon
function getFaviconUrl(): string {
  let faviconUrl = '';
  
  // Look for rel shortcut icon or icon link tags
  const iconLink = document.querySelector('link[rel~="icon"]') as HTMLLinkElement;
  if (iconLink && iconLink.href) {
    faviconUrl = iconLink.href;
  } else {
    // Standard default fallback location
    faviconUrl = `${window.location.origin}/favicon.ico`;
  }
  
  return faviconUrl;
}
