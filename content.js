let lastTime = Date.now();
let currentCategory = null;

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
  chrome.storage.sync.get('customKeywords', (data) => {
    const determined = determineCategory(window.location.href, data.customKeywords);
    if (determined) {
      setCategory(determined);
    }
  });
}

function trackActivity() {
  const now = Date.now();
  const timeSpent = Math.floor((now - lastTime) / 1000);
  if (currentCategory && timeSpent > 1) {
    chrome.runtime.sendMessage({
      type: 'logActivity',
      payload: { category: currentCategory, timeSpent }
    });
  }
  lastTime = now;
}

window.addEventListener('focus', () => {
  updateCategory();
  lastTime = Date.now();
});

window.addEventListener('blur', () => {
  trackActivity();
});

document.addEventListener('focusin', (e) => {
  if (isMessagingElement(e.target)) {
    setCategory('chatting');
  } else if (currentCategory === 'chatting') {
    updateCategory();
  }
});

updateCategory();
