let activeTabId = null;
const notified = {};

const productiveCategories = ['chatting', 'applying_jobs', 'editing_profile', 'profile_browsing'];
const unproductiveCategories = ['feed', 'reading'];

chrome.tabs.onActivated.addListener(activeInfo => {
  activeTabId = activeInfo.tabId;
});

async function checkThreshold(category, timeSpent) {
  const { categoryThresholds } = await chrome.storage.sync.get('categoryThresholds');
  const thresholds = categoryThresholds || {};
  const limit = thresholds[category];
  if (!limit) return;
  if (timeSpent >= limit && !notified[category]) {
    await chrome.notifications.create({
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
}

async function updateScore(category, timeSpent) {
  const minutes = timeSpent / 60;
  let delta = 0;
  if (productiveCategories.includes(category)) {
    delta = minutes;
  } else if (unproductiveCategories.includes(category)) {
    delta = -minutes;
  } else {
    return;
  }
  const { scoreboard } = await chrome.storage.local.get('scoreboard');
  const sb = scoreboard || { points: 0, badges: [] };
  sb.points = (sb.points || 0) + delta;
  sb.badges = sb.badges || [];
  if (sb.points >= 50 && !sb.badges.includes('Productive Pro')) {
    sb.badges.push('Productive Pro');
  }
  if (sb.points <= -30 && !sb.badges.includes('Feed Fiend')) {
    sb.badges.push('Feed Fiend');
  }
  await chrome.storage.local.set({ scoreboard: sb });
}


chrome.runtime.onMessage.addListener(async (request) => {
  if (request.type === 'logActivity') {
    const { category, timeSpent } = request.payload;

    const { activityLog = {}, activityHistory = {} } =
      await chrome.storage.local.get(['activityLog', 'activityHistory']);
    activityLog[category] = (activityLog[category] || 0) + timeSpent;

    const today = new Date().toISOString().slice(0, 10);
    activityHistory[today] = activityHistory[today] || {};
    activityHistory[today][category] =
      (activityHistory[today][category] || 0) + timeSpent;

    await chrome.storage.local.set({ activityLog, activityHistory });

    await checkThreshold(category, activityLog[category]);
    await updateScore(category, timeSpent);
  }
});
