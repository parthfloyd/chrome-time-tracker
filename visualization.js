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

function renderHeatmap(history, days = 7) {
  const container = document.getElementById('heatmap');
  if (!container) return;

  const today = new Date();
  const data = [];
  const categoriesSet = new Set();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const cats = history[key] || {};
    Object.keys(cats).forEach(c => categoriesSet.add(c));
    data.push({ date: key, cats });
  }

  const categories = Array.from(categoriesSet);
  if (!categories.length) {
    container.textContent = 'No data available.';
    return;
  }

  let maxVal = 0;
  data.forEach(d => {
    categories.forEach(cat => {
      const v = d.cats[cat] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  const table = document.createElement('table');
  table.className = 'heatmap-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Date</th>' + categories.map(c => `<th>${c.replace('_',' ')}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach(d => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = d.date.slice(5);
    row.appendChild(dateCell);
    categories.forEach(cat => {
      const val = d.cats[cat] || 0;
      const intensity = maxVal ? val / maxVal : 0;
      const cell = document.createElement('td');
      cell.style.backgroundColor = `rgba(0,115,177,${intensity})`;
      if (val) cell.title = formatTime(val);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

chrome.storage.local.get('activityHistory', ({ activityHistory }) => {
  const history = activityHistory || {};
  const daily = summarize(history, 1);
  const weekly = summarize(history, 7);
  const monthly = summarize(history, 30);
  renderSection(document.getElementById('daily'), 'Today', daily);
  renderSection(document.getElementById('weekly'), 'Last 7 Days', weekly);
  renderSection(document.getElementById('monthly'), 'Last 30 Days', monthly);
  renderHeatmap(history, 7);
});
