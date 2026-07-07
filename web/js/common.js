/* Frontend-only нийтлэг туслах */
const SITE = { name: 'Movie', facebook: '', telegram: '' }; // холбоосоо энд тохируулна

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function posterHtml(url, title) {
  if (url) return `<img class="poster" src="${esc(url)}" alt="${esc(title)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;poster&quot;>🎬 Постергүй</div>'">`;
  return `<div class="poster">🎬 Постергүй</div>`;
}
function isVip() { return Store.isVip(); }

function renderHeader() {
  const el = document.getElementById('header'); if (!el) return;
  const u = Store.current();
  const q = new URLSearchParams(location.search).get('q') || '';
  let right;
  if (u) {
    const vipTag = isVip() ? '<span class="badge-vip">VIP</span>' : '';
    const adminLink = u.role === 'admin' ? '<a href="admin.html">🛠 Админ</a>' : '';
    right = `${vipTag}${adminLink}${isVip() ? '' : '<a href="vip.html" class="btn-gold">⭐ VIP авах</a>'}
      <span style="color:var(--muted);font-size:13px">${esc(u.name)}</span>
      <a href="#" id="logoutBtn">Гарах</a>`;
  } else {
    right = `<a href="login.html">Нэвтрэх</a><a href="register.html" class="btn-primary">Бүртгүүлэх</a>`;
  }
  el.className = 'header';
  el.innerHTML = `
    <a href="index.html" class="logo">${esc(SITE.name)}<span>VIP</span></a>
    <form class="search" onsubmit="return doSearch(event)">
      <input type="text" id="searchInput" placeholder="Кино хайх..." value="${esc(q)}">
      <button class="btn btn-primary" type="submit">Хайх</button>
    </form>
    <nav class="nav">${right}</nav>`;
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = (e) => { e.preventDefault(); Store.logout(); location.href = 'index.html'; };
}
function doSearch(e) {
  e.preventDefault();
  location.href = 'search.html?q=' + encodeURIComponent(document.getElementById('searchInput').value.trim());
  return false;
}
function renderFooter() {
  const el = document.getElementById('footer'); if (!el) return;
  const s = [];
  if (SITE.facebook) s.push(`<a href="${esc(SITE.facebook)}" target="_blank" rel="noopener">📘 Facebook Page</a>`);
  if (SITE.telegram) s.push(`<a href="${esc(SITE.telegram)}" target="_blank" rel="noopener">✈️ Telegram</a>`);
  el.className = 'footer';
  el.innerHTML = `<div class="socials">${s.join('') || '<span style="color:var(--muted)">Холбоос тохируулаагүй (common.js дотор)</span>'}</div>
    <div>© ${new Date().getFullYear()} ${esc(SITE.name)}VIP — Зөвхөн VIP гишүүдэд зориулав</div>`;
}
function bootChrome() { renderHeader(); renderFooter(); }
