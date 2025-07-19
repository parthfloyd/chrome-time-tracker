let activeTabId = null;

chrome.tabs.onActivated.addListener(activeInfo => {
  activeTabId = activeInfo.tabId;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'logActivity') {
    const { category, timeSpent } = request.payload;

    chrome.storage.local.get(['activityLog'], result => {
      const log = result.activityLog || {};
      log[category] = (log[category] || 0) + timeSpent;

      chrome.storage.local.set({ activityLog: log });
    });
  }
});