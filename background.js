let activeTabId = null;
let pomodoroActive = false;
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

function startWorkTimer() {
  chrome.alarms.create('workPeriod', { delayInMinutes: 25 });
}

function startBreakTimer() {
  chrome.alarms.create('breakPeriod', { delayInMinutes: 5 });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'logActivity') {
    const { category, timeSpent } = request.payload;

    chrome.storage.local.get(['activityLog'], result => {
      const log = result.activityLog || {};
      log[category] = (log[category] || 0) + timeSpent;

      chrome.storage.local.set({ activityLog: log }, () => {
        checkThreshold(category, log[category]);
      });
    });
  } else if (request.type === 'togglePomodoro') {
    pomodoroActive = !pomodoroActive;
    chrome.storage.local.set({ pomodoroActive }, () => {
      chrome.alarms.clearAll(() => {
        if (pomodoroActive) startWorkTimer();
        sendResponse({ active: pomodoroActive });
        });
      });
    return true;
  } else if (request.type === 'getPomodoroStatus') {
    sendResponse({ active: pomodoroActive });
  }
  return true;
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (!pomodoroActive) return;
  if (alarm.name === 'workPeriod') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Break Time',
      message: 'You have been working for 25 minutes. Time for a break!'
    });
    startBreakTimer();
  } else if (alarm.name === 'breakPeriod') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Break Over',
      message: 'Break finished. Back to work!'
    });
    startWorkTimer();
  }
});

chrome.storage.local.get('pomodoroActive', data => {
  pomodoroActive = data.pomodoroActive || false;
  if (pomodoroActive) startWorkTimer();
});