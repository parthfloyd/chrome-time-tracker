document.getElementById('keywordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const keywords = document.getElementById('keywords').value;
  try {
    const parsed = JSON.parse(keywords);
    chrome.storage.sync.set({ customKeywords: parsed }, () => {
      alert('Keywords saved!');
    });
  } catch (error) {
    alert('Invalid JSON');
  }
});

chrome.storage.sync.get('customKeywords', (data) => {
  if (data.customKeywords) {
    document.getElementById('keywords').value = JSON.stringify(data.customKeywords, null, 2);
  }
});