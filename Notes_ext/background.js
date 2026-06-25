chrome.action.onClicked.addListener(() => {
  // Opens a centered window roughly 60% the size of a standard 1080p display
  chrome.windows.create({
    url: 'index.html',
    type: 'popup',
    width: 1100,
    height: 700,
    focused: true
  });
});