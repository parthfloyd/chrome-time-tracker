let activeTabId = null;
const notified = {};

chrome.tabs.onActivated.addListener(activeInfo => {
  activeTabId = activeInfo.tabId;
});

function checkThreshold(category, timeSpent) {
  chrome.storage.sync.get('categoryThresholds', ({ categoryThresholds }) => {
    const thresholds = categoryThresholds || {};
    const limit = thresholds[category];
    if (!limit) return;
    if (timeSpent >= limit && !notified[category]) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Time Alert',
        message: `You have spent more than ${Math.floor(limit/60)}m on ${category}.`
      });
      notified[category] = true;
    }
    if (timeSpent < limit) {
      notified[category] = false;
    }
  });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'logActivity') {
    const { category, timeSpent } = request.payload;

    chrome.storage.local.get(['activityLog', 'activityHistory'], result => {
      const log = result.activityLog || {};
      const history = result.activityHistory || {};
      log[category] = (log[category] || 0) + timeSpent;

      const today = new Date().toISOString().slice(0, 10);
      history[today] = history[today] || {};
      history[today][category] = (history[today][category] || 0) + timeSpent;

      chrome.storage.local.set({ activityLog: log, activityHistory: history }, () => {
        checkThreshold(category, log[category]);
      });
    });
    return;
  }

});
