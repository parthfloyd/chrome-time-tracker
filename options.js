document.getElementById('keywordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const keywords = document.getElementById('keywords').value;
  const idle = parseInt(document.getElementById('idleThreshold').value, 10) || 60;
  const categoryThresh = document.getElementById('categoryThresholds').value;
  try {
    const parsedKeywords = JSON.parse(keywords);
    const parsedThresh = categoryThresh ? JSON.parse(categoryThresh) : {};
    chrome.storage.sync.set({
      customKeywords: parsedKeywords,
      idleThreshold: idle,
      categoryThresholds: parsedThresh
    }, () => {
      alert('Options saved!');
    });
  } catch (error) {
    alert('Invalid JSON');
  }
});

chrome.storage.sync.get(['customKeywords','idleThreshold','categoryThresholds'], (data) => {
  if (data.customKeywords) {
    document.getElementById('keywords').value = JSON.stringify(data.customKeywords, null, 2);
  }
  if (data.idleThreshold) {
    document.getElementById('idleThreshold').value = data.idleThreshold;
  }
  if (data.categoryThresholds) {
    document.getElementById('categoryThresholds').value = JSON.stringify(data.categoryThresholds, null, 2);
  }
});