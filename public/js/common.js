// Нийтлэг туслах функцууд
const api = async (path, opts = {}) => {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  let data = {};
  try { data = await res.json(); } catch (_e) {}
  if (!res.ok) throw Object.assign(new Error(data.error || 'Алдаа гарлаа'), { status: res.status, data });
  return data;
};

let CURRENT_USER = null;
let SITE = { siteName: 'MovieVIP', facebook: '', telegram: '' };

async function loadSession() {
  try { SITE = await api('/config'); } catch (_e) {}
  try {
    const { user } = await api('/auth/me');
    CURRENT_USER = user;
  } catch (_e) { CURRENT_USER = null; }
  return CURRENT_USER;
}

function isVip(u) {
  u = u || CURRENT_USER;
  return !!(u && (u.role === 'admin' || u.is_vip));
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function posterHtml(url, title) {
  if (url) return `<img class="poster" src="${esc(url)}" alt="${esc(title)}" loading="lazy">`;
  return `<div class="poster">🎬 Постергүй</div>`;
}

// Толгой хэсгийг зурах
function renderHeader() {
  const el = document.getElementById('header');
  if (!el) return;
  const q = new URLSearchParams(location.search).get('q') || '';
  let right = '';
  if (CURRENT_USER) {
    const vipTag = isVip() ? '<span class="badge-vip">VIP</span>' : '';
    const adminLink = CURRENT_USER.role === 'admin' ? '<a href="/admin.html">🛠 Админ</a>' : '';
    right = `
      ${vipTag}
      ${adminLink}
      ${isVip() ? '' : '<a href="/vip.html" class="btn-gold">⭐ VIP авах</a>'}
      <span class="nav-name" style="color:var(--muted);font-size:13px">${esc(CURRENT_USER.name)}</span>
      <a href="#" id="logoutBtn">Гарах</a>`;
  } else {
    right = `<a href="/login.html">Нэвтрэх</a><a href="/register.html" class="btn-primary">Бүртгүүлэх</a>`;
  }
  el.className = 'header';
  el.innerHTML = `
    <a href="/" class="logo">${esc(SITE.siteName || 'Movie')}<span>VIP</span></a>
    <form class="search" onsubmit="return doSearch(event)">
      <input type="text" id="searchInput" placeholder="Кино хайх..." value="${esc(q)}">
      <button class="btn btn-primary" type="submit">Хайх</button>
    </form>
    <nav class="nav">${right}</nav>`;

  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = async (e) => { e.preventDefault(); await api('/auth/logout', { method: 'POST' }); location.href = '/'; };
}

function doSearch(e) {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  location.href = '/search.html?q=' + encodeURIComponent(q);
  return false;
}

function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;
  const socials = [];
  if (SITE.facebook) socials.push(`<a href="${esc(SITE.facebook)}" target="_blank" rel="noopener">📘 Facebook Page</a>`);
  if (SITE.telegram) socials.push(`<a href="${esc(SITE.telegram)}" target="_blank" rel="noopener">✈️ Telegram</a>`);
  el.className = 'footer';
  el.innerHTML = `
    <div class="socials">${socials.join('') || '<span style="color:var(--muted)">Холбоос тохируулаагүй</span>'}</div>
    <div>© ${new Date().getFullYear()} ${esc(SITE.siteName || 'MovieVIP')} — Зөвхөн VIP гишүүдэд зориулав</div>`;
}

async function bootChrome() {
  await loadSession();
  renderHeader();
  renderFooter();
}
