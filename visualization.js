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
  let count = 0;
  for (const [date, cats] of Object.entries(history)) {
    const d = new Date(date);
    if (d < cutoff) continue;
    count++;
    for (const [cat, val] of Object.entries(cats)) {
      sum[cat] = (sum[cat] || 0) + val;
    }
  }
  return { sum, count };
}

function renderSection(el, title, summary) {
  el.innerHTML = `<h3>${title}</h3>`;
  let total = 0;
  for (const val of Object.values(summary.sum)) total += val;
  const avg = summary.count ? total / summary.count : 0;

  const chart = document.createElement('div');
  chart.style.display = 'grid';
  chart.style.gap = '6px';

  for (const [cat, val] of Object.entries(summary.sum)) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';

    const label = document.createElement('div');
    label.style.flex = '0 0 auto';
    label.textContent = `${cat.replace('_',' ')}: ${formatTime(val)}`;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const percent = total ? (val / total) * 100 : 0;
    bar.style.width = percent + '%';
    row.appendChild(label);
    row.appendChild(bar);
    chart.appendChild(row);
  }

  const avgEl = document.createElement('div');
  avgEl.textContent = `Average per day: ${formatTime(Math.round(avg))}`;
  el.appendChild(chart);
  el.appendChild(avgEl);
}

chrome.storage.local.get('activityHistory', ({ activityHistory }) => {
  const history = activityHistory || {};
  const daily = summarize(history, 1);
  const weekly = summarize(history, 7);
  const monthly = summarize(history, 30);
  renderSection(document.getElementById('daily'), 'Today', daily);
  renderSection(document.getElementById('weekly'), 'Last 7 Days', weekly);
  renderSection(document.getElementById('monthly'), 'Last 30 Days', monthly);
});
