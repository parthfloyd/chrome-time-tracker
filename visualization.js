function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (hrs) parts.push(`${hrs}h`);
  if (mins || !hrs) parts.push(`${mins}m`);
  return parts.join(' ');
}

function summarize(history, days) {
  const sum = {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  for (const [date, cats] of Object.entries(history)) {
    const d = new Date(date);
    if (d < cutoff) continue;
    for (const [cat, val] of Object.entries(cats)) {
      sum[cat] = (sum[cat] || 0) + val;
    }
  }
  return sum;
}

function renderSection(el, title, summary, days) {
  el.innerHTML = `<h3>${title}</h3>`;
  let total = 0;
  for (const val of Object.values(summary)) total += val;
  const avg = total / days;
  const ul = document.createElement('ul');
  for (const [cat, val] of Object.entries(summary)) {
    const li = document.createElement('li');
    li.textContent = `${cat.replace('_',' ')}: ${formatTime(val)}`;
    ul.appendChild(li);
  }
  const avgEl = document.createElement('div');
  avgEl.textContent = `Average per day: ${formatTime(Math.round(avg))}`;
  el.appendChild(ul);
  el.appendChild(avgEl);
}

chrome.storage.local.get('activityHistory', ({ activityHistory }) => {
  const history = activityHistory || {};
  const daily = summarize(history, 1);
  const weekly = summarize(history, 7);
  const monthly = summarize(history, 30);
  renderSection(document.getElementById('daily'), 'Today', daily, 1);
  renderSection(document.getElementById('weekly'), 'Last 7 Days', weekly, 7);
  renderSection(document.getElementById('monthly'), 'Last 30 Days', monthly, 30);
});
