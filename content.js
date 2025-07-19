let lastTime = Date.now();
let lastActivity = Date.now();
let currentCategory = null;
let intervalId = null;
let idleThreshold = 60;
let isIdle = false;

const DEFAULT_KEYWORDS = {
  reading: ['feed', 'article', 'news'],
  feed: ['feed'],
  chatting: ['messaging', 'chat'],
  profile_browsing: ['profile', 'about'],
  applying_jobs: ['apply', 'job'],
  editing_profile: ['edit', 'resume']
};

function determineCategory(url, customKeywords) {
  const keywords = customKeywords || DEFAULT_KEYWORDS;
  for (const category in keywords) {
    if (keywords[category].some(keyword => url.includes(keyword))) {
      return category;
    }
  }
  return null;
}

function isMessagingElement(element) {
  let el = element;
  while (el && el !== document.body) {
    const id = el.id ? el.id.toLowerCase() : '';
    const cls = el.className ? el.className.toLowerCase() : '';
    if (/chat|msg|messag/.test(id) || /chat|msg|messag/.test(cls)) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function setCategory(newCategory) {
  if (currentCategory !== newCategory) {
    trackActivity();
    currentCategory = newCategory;
  }
}

function updateCategory() {
  chrome.storage.sync.get(['customKeywords','idleThreshold'], (data) => {
    const determined = determineCategory(window.location.href, data.customKeywords);
    if (determined) {
      setCategory(determined);
    }
    if (data.idleThreshold) {
      idleThreshold = data.idleThreshold;
    }
  });
}

function trackActivity() {
  const now = Date.now();
  const timeSpent = Math.floor((now - lastTime) / 1000);
  if (currentCategory && timeSpent > 0) {
    chrome.runtime.sendMessage({
      type: 'logActivity',
      payload: { category: currentCategory, timeSpent }
    });
  }
  lastTime = now;
  lastActivity = now;
}

function startInterval() {
  if (!intervalId) {
    intervalId = setInterval(() => {
      if (document.hasFocus()) {
        trackActivity();
      }
    }, 5000);
  }
}

function stopInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

window.addEventListener('focus', () => {
  updateCategory();
  lastTime = Date.now();
  startInterval();
});

window.addEventListener('blur', () => {
  trackActivity();
  stopInterval();
});

['mousemove', 'keydown', 'scroll'].forEach(evt => {
  window.addEventListener(evt, () => {
    lastActivity = Date.now();
    if (isIdle) {
      isIdle = false;
      lastTime = lastActivity;
      updateCategory();
    }
  }, true);
});

setInterval(() => {
  if (!isIdle && Date.now() - lastActivity > idleThreshold * 1000) {
    trackActivity();
    isIdle = true;
    currentCategory = null;
  }
}, 5000);

document.addEventListener('focusin', (e) => {
  if (isMessagingElement(e.target)) {
    setCategory('chatting');
  } else if (currentCategory === 'chatting') {
    updateCategory();
  }
});

updateCategory();
startInterval();

