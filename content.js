let lastTime = Date.now();
let lastActivity = Date.now();
let currentCategory = null;
let intervalId = null;
let idleThreshold = 60;
let isIdle = false;
// Only enable the tracker on the main LinkedIn site
const isLinkedIn = window.location.hostname === 'www.linkedin.com';

function formatOverlayTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

const DEFAULT_KEYWORDS = {
  reading: ['feed', 'news'],
  feed: ['feed'],
  chatting: ['messaging', 'chat'],
  profile_browsing: ['in', 'about'],
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

const storage = (chrome.storage && chrome.storage.sync) ?
  chrome.storage.sync : chrome.storage.local;

function updateCategory() {
  storage.get(['customKeywords','idleThreshold'], (data) => {
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
      if (document.visibilityState === 'visible' && document.hasFocus()) {
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

if (isLinkedIn) {
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

  const overlay = document.createElement('div');
overlay.id = 'timeTrackerOverlay';
overlay.style.position = 'fixed';
overlay.style.bottom = '10px';
overlay.style.right = '10px';
overlay.style.padding = '6px 10px';
overlay.style.background = 'rgba(0,115,177,0.9)';
overlay.style.color = '#fff';
overlay.style.fontSize = '14px';
overlay.style.borderRadius = '4px';
overlay.style.zIndex = '9999';
overlay.style.pointerEvents = 'none';
overlay.style.display = 'none';
overlay.style.animation = 'cttPulse 1s infinite';
document.body.appendChild(overlay);

const style = document.createElement('style');
style.textContent = `@keyframes cttPulse {0%{opacity:.6;}50%{opacity:1;}100%{opacity:.6;}}`;
document.head.appendChild(style);

let overlaySeconds = 0;
setInterval(() => {
  if (document.visibilityState === 'visible' && document.hasFocus() && !isIdle && currentCategory) {
    overlaySeconds++;
    overlay.textContent = `${currentCategory.replace('_',' ')}: ${formatOverlayTime(overlaySeconds)}`;
    overlay.style.display = 'block';
  } else {
    overlaySeconds = 0;
    overlay.style.display = 'none';
  }
}, 1000);

}

