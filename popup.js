const logList = document.getElementById('logList');
const resetBtn = document.getElementById('resetBtn');
const pomodoroBtn = document.getElementById('pomodoroBtn');

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function renderLog(log) {
  logList.innerHTML = '';
  for (const category in log) {
    const li = document.createElement('li');
    li.textContent = `${category.replace('_', ' ')}: ${formatTime(log[category])}`;
    logList.appendChild(li);
  }
}

chrome.storage.local.get(['activityLog'], result => {
  renderLog(result.activityLog || {});
});

resetBtn.addEventListener('click', () => {
  chrome.storage.local.set({ activityLog: {} }, () => {
    renderLog({});
  });
});

function updatePomodoroButton() {
  chrome.runtime.sendMessage({ type: 'getPomodoroStatus' }, status => {
    pomodoroBtn.textContent = status && status.active ? 'Stop Pomodoro' : 'Start Pomodoro';
  });
}

pomodoroBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'togglePomodoro' }, updatePomodoroButton);
});

updatePomodoroButton();