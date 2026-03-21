/**
 * D360Sync – AI Latest News Feed
 * Fetches AI/Claude Code news from multiple RSS sources via rss2json.com (free, open API)
 * Falls back gracefully if individual feeds fail.
 */

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const SOURCES = [
  {
    key: 'anthropic',
    label: 'Anthropic Blog',
    rss: 'https://www.anthropic.com/rss.xml',
    colorClass: 'dot-anthropic',
    nameClass: 'name-anthropic',
  },
  {
    key: 'techcrunch',
    label: 'TechCrunch AI',
    rss: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    colorClass: 'dot-techcrunch',
    nameClass: 'name-techcrunch',
  },
  {
    key: 'verge',
    label: 'The Verge AI',
    rss: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    colorClass: 'dot-verge',
    nameClass: 'name-verge',
  },
  {
    key: 'hnai',
    label: 'Hacker News AI',
    rss: 'https://hnrss.org/newest?q=AI+LLM+Claude+GPT&count=20',
    colorClass: 'dot-hnai',
    nameClass: 'name-hnai',
  },
  {
    key: 'mittech',
    label: 'MIT Tech Review',
    rss: 'https://www.technologyreview.com/feed/',
    colorClass: 'dot-mittech',
    nameClass: 'name-mittech',
  },
];

let allArticles = [];
let activeFilter = 'all';
let currentSort = 'date';

// ── Claude / AI keywords to highlight ──────────────────────
const CLAUDE_KEYWORDS = [
  'claude', 'anthropic', 'claude code', 'claude 3', 'claude sonnet', 'claude opus',
  'claude haiku', 'constitutional ai', 'mcp', 'model context protocol'
];

function isClaudeRelated(text = '') {
  const lower = text.toLowerCase();
  return CLAUDE_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Fetch a single RSS feed ─────────────────────────────────
async function fetchFeed(source) {
  const url = `${RSS2JSON}${encodeURIComponent(source.rss)}&count=15`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'Feed error');
  return (data.items || []).map(item => ({
    source: source.key,
    sourceLabel: source.label,
    colorClass: source.colorClass,
    nameClass: source.nameClass,
    title: item.title || '',
    summary: stripHtml(item.description || item.content || ''),
    link: item.link || item.guid || '#',
    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(0),
  }));
}

// ── Strip HTML tags from summary ───────────────────────────
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

// ── Format relative time ───────────────────────────────────
function timeAgo(date) {
  if (!date || date.getTime() === 0) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Build a news card HTML ─────────────────────────────────
function buildCard(article) {
  const claude = isClaudeRelated(article.title + ' ' + article.summary);
  const claudeTag = claude
    ? `<span class="news-tag tag-claude"><i class="bi bi-stars"></i>Claude</span>`
    : '';

  return `
    <div class="col-sm-6 col-lg-4 news-item" data-source="${article.source}">
      <div class="news-card" data-source="${article.source}">
        <div class="news-card-source">
          <span class="source-dot ${article.colorClass}"></span>
          <span class="source-name ${article.nameClass}">${article.sourceLabel}</span>
          <span class="news-date">${timeAgo(article.pubDate)}</span>
        </div>
        <div class="news-card-body">
          <h3 class="news-card-title">${escapeHtml(article.title)}</h3>
          <p class="news-card-summary">${escapeHtml(article.summary)}</p>
        </div>
        <div class="news-card-footer">
          ${claudeTag}
          <a href="${article.link}" target="_blank" rel="noopener" class="btn-read ms-auto">
            Read <i class="bi bi-box-arrow-up-right ms-1"></i>
          </a>
        </div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render filtered & sorted articles ─────────────────────
function renderNews() {
  const grid = document.getElementById('newsGrid');
  const countEl = document.getElementById('articleCount');

  let items = activeFilter === 'all'
    ? [...allArticles]
    : allArticles.filter(a => a.source === activeFilter);

  if (currentSort === 'date') {
    items.sort((a, b) => b.pubDate - a.pubDate);
  } else {
    items.sort((a, b) => a.sourceLabel.localeCompare(b.sourceLabel));
  }

  if (items.length === 0) {
    grid.innerHTML = `<div class="col-12 no-results"><i class="bi bi-search"></i>No articles found for this filter.</div>`;
    countEl.textContent = '0 articles';
  } else {
    grid.innerHTML = items.map(buildCard).join('');
    countEl.textContent = `${items.length} article${items.length !== 1 ? 's' : ''}`;
  }
}

// ── Filter handler ─────────────────────────────────────────
function filterNews(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNews();
}

// ── Sort handler ───────────────────────────────────────────
function sortNews(sort, btn) {
  currentSort = sort;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNews();
}

// ── Load all feeds concurrently ────────────────────────────
async function loadAllFeeds() {
  const loadingEl   = document.getElementById('loadingState');
  const errorEl     = document.getElementById('errorState');
  const containerEl = document.getElementById('newsContainer');
  const errorMsgEl  = document.getElementById('errorMsg');
  const lastUpdEl   = document.getElementById('lastUpdated');
  const refreshBtn  = document.getElementById('refreshBtn');

  // reset UI
  allArticles = [];
  loadingEl.classList.remove('d-none');
  containerEl.classList.add('d-none');
  errorEl.classList.add('d-none');
  refreshBtn.classList.add('spinning');

  const results = await Promise.allSettled(SOURCES.map(fetchFeed));

  const failed = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      failed.push(SOURCES[i].label);
      console.warn(`Feed failed [${SOURCES[i].label}]:`, result.reason);
    }
  });

  loadingEl.classList.add('d-none');
  refreshBtn.classList.remove('spinning');

  if (failed.length > 0) {
    errorMsgEl.textContent = `Could not load: ${failed.join(', ')}. Showing available content.`;
    errorEl.classList.remove('d-none');
  }

  if (allArticles.length > 0) {
    containerEl.classList.remove('d-none');
    lastUpdEl.textContent = `Updated ${timeAgo(new Date())}`;
    renderNews();
  } else {
    loadingEl.classList.remove('d-none');
    loadingEl.innerHTML = `
      <div class="no-results">
        <i class="bi bi-wifi-off"></i>
        <p>Unable to load news feeds. Please check your internet connection and try again.</p>
        <button class="btn btn-sm btn-refresh mt-2" onclick="loadAllFeeds()">
          <i class="bi bi-arrow-clockwise me-1"></i>Try Again
        </button>
      </div>`;
  }
}

// ── Init on page load ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadAllFeeds);
