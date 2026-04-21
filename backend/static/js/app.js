/* ── SNS 트렌드 AI 에이전트 ─ Main App ─────────────────────────── */
const App = (() => {
  /* ── State ── */
  const state = {
    data: {},          // { google:[], reddit:[], youtube:[], rss:[], instagram:[], threads:[] }
    activePlatform: 'all',
    filterText: '',
    lastUpdated: null,
    loading: false,
  };

  const PLATFORM_META = {
    google:    { label: 'Google 트렌드', icon: '🔍', color: '#EA4335' },
    reddit:    { label: 'Reddit',        icon: '👾', color: '#FF4500' },
    youtube:   { label: 'YouTube',       icon: '▶',  color: '#FF0000' },
    rss:       { label: '뉴스 RSS',      icon: '📰', color: '#F59E0B' },
    instagram: { label: 'Instagram',     icon: '📸', color: '#E1306C' },
    threads:   { label: 'Threads',       icon: '🧵', color: '#a0a0a0' },
  };

  const AUTO_REFRESH_MS = 5 * 60 * 1000;  // 5 minutes
  let autoRefreshTimer = null;

  /* ── Boot ── */
  async function boot() {
    Charts.init();
    bindTabs();
    await fetchStatus();
    await refreshAll();
    scheduleAutoRefresh();
  }

  /* ── API calls ── */
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      renderSourceStatus(json.sources);
    } catch { /* ignore */ }
  }

  async function fetchAllTrends() {
    const res = await fetch('/api/trends/all');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  /* ── Refresh ── */
  async function refreshAll() {
    if (state.loading) return;
    state.loading = true;

    const btn = document.getElementById('refreshBtn');
    btn?.classList.add('spinning');
    showLoading();

    try {
      const json = await fetchAllTrends();
      state.data = json.data || {};
      state.lastUpdated = new Date();
      updateStats(json.meta);
      renderGrid();
      updateCharts();
      updateLastUpdateText();
      toast('트렌드가 업데이트되었습니다 ✓', 'ok');
    } catch (e) {
      console.error(e);
      toast('데이터를 불러오지 못했습니다. 서버가 실행 중인지 확인하세요.', 'err');
      showNoData();
    } finally {
      state.loading = false;
      btn?.classList.remove('spinning');
    }
  }

  /* ── Scheduled auto-refresh ── */
  function scheduleAutoRefresh() {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = setTimeout(async () => {
      await refreshAll();
      scheduleAutoRefresh();
    }, AUTO_REFRESH_MS);
  }

  /* ── Source status pills ── */
  function renderSourceStatus(sources) {
    const el = document.getElementById('sourceStatus');
    if (!el) return;
    el.innerHTML = Object.entries(sources).map(([k, v]) => {
      const on = v.available;
      return `
        <div class="spill ${on ? 'on' : 'off'}" title="${v.note || ''}">
          <span class="spill-dot"></span>
          ${PLATFORM_META[k]?.label || k}
        </div>`;
    }).join('');
  }

  /* ── Stats ── */
  function updateStats(meta = {}) {
    const counts = Object.values(state.data).map(v => Array.isArray(v) ? v.length : 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const activeSources = Object.values(state.data).filter(v => Array.isArray(v) && v.length > 0).length;

    setText('statTotal', total.toLocaleString());
    setText('statSources', `${activeSources} / ${Object.keys(PLATFORM_META).length}`);
    if (state.lastUpdated) {
      setText('statUpdated', state.lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    }
  }

  function updateLastUpdateText() {
    if (!state.lastUpdated) return;
    const el = document.getElementById('lastUpdateText');
    if (el) el.textContent = `${state.lastUpdated.toLocaleTimeString('ko-KR')} 업데이트`;
  }

  /* ── Charts ── */
  function updateCharts() {
    Charts.updateKeywords(state.data.google || []);

    const counts = {};
    for (const [key, val] of Object.entries(state.data)) {
      const n = Array.isArray(val) ? val.length : 0;
      if (n > 0) counts[key] = n;
    }
    Charts.updateDist(counts);
  }

  /* ── Tabs ── */
  function bindTabs() {
    document.getElementById('tabs')?.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        state.activePlatform = btn.dataset.platform;
        state.filterText = '';
        const si = document.getElementById('searchInput');
        if (si) si.value = '';
        renderGrid();
      });
    });
  }

  /* ── Filter ── */
  function filter(text) {
    state.filterText = text.toLowerCase();
    renderGrid();
  }

  /* ── Grid rendering ── */
  function showLoading() {
    const grid = document.getElementById('trendsGrid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="empty-state" id="loadingState">
        <div class="spinner"></div>
        <p>트렌드 데이터를 수집 중입니다…</p>
      </div>`;
  }

  function showNoData() {
    const grid = document.getElementById('trendsGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="no-data-msg">데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</div>`;
  }

  function renderGrid() {
    const grid = document.getElementById('trendsGrid');
    if (!grid) return;

    const items = getFilteredItems();
    if (items.length === 0) {
      grid.innerHTML = `<div class="no-data-msg">표시할 트렌드가 없습니다.<br>API 키 설정을 확인하거나 새로고침을 시도해 보세요.</div>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join('');
  }

  function getFilteredItems() {
    const { activePlatform, filterText } = state;

    let raw = [];
    if (activePlatform === 'all') {
      for (const items of Object.values(state.data)) {
        if (Array.isArray(items)) raw = raw.concat(items);
      }
    } else {
      raw = Array.isArray(state.data[activePlatform]) ? state.data[activePlatform] : [];
    }

    if (!filterText) return raw;
    return raw.filter(item => {
      const haystack = `${item.title || ''} ${item.description || ''} ${item.channel || ''} ${item.subreddit || ''}`.toLowerCase();
      return haystack.includes(filterText);
    });
  }

  /* ── Card HTML ── */
  function renderCard(item) {
    const platform = item.platform || 'rss';
    const meta = PLATFORM_META[platform] || { label: platform, icon: '📌', color: '#6366f1' };

    let thumb = '';
    if (item.thumbnail) {
      thumb = `<img class="card-thumb" src="${esc(item.thumbnail)}" alt="" loading="lazy" onerror="this.style.display='none'" />`;
    }

    const rankLabel = item.rank ? `<span class="card-rank">#${item.rank}</span>` : '';
    const title = item.title || item.description || '(제목 없음)';
    const titleHtml = item.url
      ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(title)}</a>`
      : esc(title);

    const desc = item.description && item.description !== title
      ? `<div class="card-desc">${esc(item.description)}</div>` : '';

    const metaItems = buildMetaItems(item, platform);

    return `
      <div class="card plat-${platform}" style="--platform-color:${meta.color}">
        <div class="card-header">
          <div class="card-badge">
            <span>${meta.icon}</span>
            ${meta.label}
          </div>
          ${rankLabel}
        </div>
        ${thumb}
        <div class="card-title">${titleHtml}</div>
        ${desc}
        <div class="card-meta">${metaItems}</div>
      </div>`;
  }

  function buildMetaItems(item, platform) {
    const parts = [];

    if (platform === 'reddit') {
      if (item.subreddit) parts.push(metaItem('👾', `r/${item.subreddit}`));
      if (item.score != null) parts.push(metaItem('▲', fmtNum(item.score)));
      if (item.comment_count != null) parts.push(metaItem('💬', fmtNum(item.comment_count)));
    } else if (platform === 'youtube') {
      if (item.channel) parts.push(metaItem('📺', esc(item.channel)));
      if (item.view_count) parts.push(metaItem('👁', fmtNum(item.view_count)));
      if (item.like_count) parts.push(metaItem('♥', fmtNum(item.like_count)));
    } else if (platform === 'rss') {
      if (item.source) parts.push(metaItem('📰', esc(item.source)));
      if (item.published) parts.push(metaItem('🕐', fmtDate(item.published)));
    } else if (platform === 'google') {
      if (item.rank) parts.push(metaItem('📈', `트렌딩 ${item.rank}위`));
    } else if (platform === 'instagram') {
      if (item.rank) parts.push(metaItem('📸', `#${item.rank}`));
    }

    return parts.join('');
  }

  function metaItem(icon, text) {
    return `<span class="card-meta-item"><span>${icon}</span><span>${text}</span></span>`;
  }

  /* ── Utilities ── */
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function fmtNum(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function fmtDate(s) {
    if (!s) return '';
    try {
      return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch { return s.slice(0, 10); }
  }

  /* ── Toast ── */
  let toastTimer;
  function toast(msg, type = 'ok') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  /* ── Public API ── */
  return { boot, refreshAll, filter };
})();

/* ── Start ── */
document.addEventListener('DOMContentLoaded', () => App.boot());
