let activeTabId = null;
const notified = {};

const productiveCategories = ['chatting', 'applying_jobs', 'editing_profile', 'profile_browsing'];
const unproductiveCategories = ['feed', 'reading'];

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

function updateScore(category, timeSpent) {
  const minutes = timeSpent / 60;
  let delta = 0;
  if (productiveCategories.includes(category)) {
    delta = minutes;
  } else if (unproductiveCategories.includes(category)) {
    delta = -minutes;
  } else {
    return;
  }
  chrome.storage.local.get('scoreboard', ({ scoreboard }) => {
    scoreboard = scoreboard || { points: 0, badges: [] };
    scoreboard.points = (scoreboard.points || 0) + delta;
    scoreboard.badges = scoreboard.badges || [];
    if (scoreboard.points >= 50 && !scoreboard.badges.includes('Productive Pro')) {
      scoreboard.badges.push('Productive Pro');
    }
    if (scoreboard.points <= -30 && !scoreboard.badges.includes('Feed Fiend')) {
      scoreboard.badges.push('Feed Fiend');
    }
    chrome.storage.local.set({ scoreboard });
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
    updateScore(category, timeSpent);
    return;
  }

});
