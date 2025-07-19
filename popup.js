const logList = document.getElementById('logList');
const resetBtn = document.getElementById('resetBtn');
const chartCanvas = document.getElementById('chart');
const tooltip = document.getElementById('tooltip');
const statsBtn = document.getElementById('statsBtn');
const pointsDiv = document.getElementById('points');
const badgesList = document.getElementById('badges');
let segments = [];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function drawChart(log) {
  const ctx = chartCanvas.getContext('2d');
  const total = Object.values(log).reduce((a, b) => a + b, 0);
  const cx = chartCanvas.width / 2;
  const cy = chartCanvas.height / 2;
  const radius = Math.min(cx, cy) - 5;
  const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'];
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  segments = [];
  let start = -Math.PI / 2;
  Object.entries(log).forEach(([cat, value], idx) => {
    const angle = total ? (value / total) * 2 * Math.PI : 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fill();
    segments.push({ start, end: start + angle, cat, value });
    start += angle;
  });
}

function renderLog(log) {
  logList.innerHTML = '';
  for (const category in log) {
    const li = document.createElement('li');
    li.textContent = `${category.replace('_', ' ')}: ${formatTime(log[category])}`;
    logList.appendChild(li);
  }
  drawChart(log);
}

function refreshScoreboard() {
  chrome.storage.local.get('scoreboard', ({ scoreboard }) => {
    scoreboard = scoreboard || { points: 0, badges: [] };
    pointsDiv.textContent = `Points: ${Math.floor(scoreboard.points)}`;
    badgesList.innerHTML = '';
    (scoreboard.badges || []).forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      badgesList.appendChild(li);
    });
  });
}


function refreshLog() {
  chrome.storage.local.get(['activityLog'], result => {
    const log = result.activityLog || {};
    renderLog(log);
  });
}

refreshLog();
setInterval(refreshLog, 1000);
refreshScoreboard();
setInterval(refreshScoreboard, 1000);

resetBtn.addEventListener('click', () => {
  chrome.storage.local.set({ activityLog: {}, scoreboard: { points: 0, badges: [] } }, () => {
    renderLog({});
    refreshScoreboard();
  });
});


chartCanvas.addEventListener('mousemove', (e) => {
  const rect = chartCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left - chartCanvas.width / 2;
  const y = e.clientY - rect.top - chartCanvas.height / 2;
  const dist = Math.sqrt(x * x + y * y);
  const radius = Math.min(chartCanvas.width, chartCanvas.height) / 2 - 5;
  if (dist > radius) {
    tooltip.style.display = 'none';
    return;
  }
  let angle = Math.atan2(y, x) + Math.PI / 2;
  if (angle < 0) angle += 2 * Math.PI;
  for (const seg of segments) {
    if (angle >= seg.start && angle < seg.end) {
      tooltip.textContent = `${seg.cat.replace('_', ' ')}: ${formatTime(seg.value)}`;
      tooltip.style.left = `${e.pageX + 5}px`;
      tooltip.style.top = `${e.pageY + 5}px`;
      tooltip.style.display = 'block';
      return;
    }
  }
  tooltip.style.display = 'none';
});

chartCanvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

statsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'visualization.html' });
});
