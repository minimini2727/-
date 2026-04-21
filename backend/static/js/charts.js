/* ── Charts module ────────────────────────────────────────────── */
const Charts = (() => {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#25253a';
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const PLATFORM_COLORS = {
    google: '#EA4335',
    reddit: '#FF4500',
    youtube: '#FF0000',
    rss: '#F59E0B',
    instagram: '#E1306C',
    threads: '#a0a0a0',
  };

  let keywordsChart = null;
  let distChart = null;

  function initKeywords() {
    const ctx = document.getElementById('topKeywordsChart');
    if (!ctx) return;
    keywordsChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderRadius: 5 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` 순위 #${ctx.parsed.x}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#1a1a28' },
            ticks: { font: { size: 11 } },
            reverse: true,
            title: { display: true, text: '순위', font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
  }

  function initDist() {
    const ctx = document.getElementById('platformDistChart');
    if (!ctx) return;
    distChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], hoverOffset: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}개`,
            },
          },
        },
      },
    });
  }

  function updateKeywords(googleItems) {
    if (!keywordsChart) return;
    const top = googleItems.slice(0, 15);
    keywordsChart.data.labels = top.map(i => i.title);
    keywordsChart.data.datasets[0].data = top.map(i => i.rank);
    keywordsChart.data.datasets[0].backgroundColor = top.map((_, idx) => {
      const alpha = 0.9 - idx * 0.04;
      return `rgba(99,102,241,${Math.max(alpha, 0.3)})`;
    });
    keywordsChart.update('active');
  }

  function updateDist(counts) {
    if (!distChart) return;
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = labels.map(l => PLATFORM_COLORS[l] || '#6366f1');
    distChart.data.labels = labels.map(labelName);
    distChart.data.datasets[0].data = data;
    distChart.data.datasets[0].backgroundColor = colors;
    distChart.update('active');
  }

  function labelName(key) {
    const map = {
      google: 'Google 트렌드', reddit: 'Reddit', youtube: 'YouTube',
      rss: '뉴스 RSS', instagram: 'Instagram', threads: 'Threads',
    };
    return map[key] || key;
  }

  function init() {
    initKeywords();
    initDist();
  }

  return { init, updateKeywords, updateDist };
})();
