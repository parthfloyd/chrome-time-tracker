const storage = (chrome.storage && chrome.storage.sync) ?
  chrome.storage.sync : chrome.storage.local;

document.getElementById('keywordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const keywords = document.getElementById('keywords').value;
  const idle = parseInt(document.getElementById('idleThreshold').value, 10) || 60;
  const overlayDelay = parseInt(document.getElementById('overlayDelay').value, 10) || 60;
  const overlayEnabled = document.getElementById('overlayEnabled').checked;
  const categoryThresh = document.getElementById('categoryThresholds').value;
  try {
    const parsedKeywords = JSON.parse(keywords);
    const parsedThresh = categoryThresh ? JSON.parse(categoryThresh) : {};
    storage.set({
      customKeywords: parsedKeywords,
      idleThreshold: idle,
      categoryThresholds: parsedThresh,
      overlayDelay,
      overlayEnabled
    }, () => {
      alert('Options saved!');
    });
  } catch (error) {
    alert('Invalid JSON');
  }
});

storage.get(['customKeywords','idleThreshold','categoryThresholds','overlayDelay','overlayEnabled'], (data) => {
  if (data.customKeywords) {
    document.getElementById('keywords').value = JSON.stringify(data.customKeywords, null, 2);
  }
  if (data.idleThreshold) {
    document.getElementById('idleThreshold').value = data.idleThreshold;
  }
  if (data.categoryThresholds) {
    document.getElementById('categoryThresholds').value = JSON.stringify(data.categoryThresholds, null, 2);
  }
  if (typeof data.overlayDelay === 'number') {
    document.getElementById('overlayDelay').value = data.overlayDelay;
  } else {
    document.getElementById('overlayDelay').value = 60;
  }
  if (typeof data.overlayEnabled === 'boolean') {
    document.getElementById('overlayEnabled').checked = data.overlayEnabled;
  }
});