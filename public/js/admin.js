let SELECTED_MOVIE = null;

async function boot() {
  await bootChrome();
  const guard = document.getElementById('guard');
  if (!CURRENT_USER) {
    guard.innerHTML = '<div class="msg err">Нэвтрэх шаардлагатай. <a class="link" href="/login.html">Нэвтрэх</a></div>';
    return;
  }
  if (CURRENT_USER.role !== 'admin') {
    guard.innerHTML = '<div class="msg err">Зөвхөн админ хандах боломжтой.</div>';
    return;
  }
  document.getElementById('panel').classList.remove('hide');
  loadMovies();
  document.getElementById('movieForm').onsubmit = saveMovie;
  document.getElementById('epForm').onsubmit = saveEpisode;
}

function switchTab(tab) {
  document.querySelectorAll('.admin-tabs .btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('tab-movies').classList.toggle('hide', tab !== 'movies');
  document.getElementById('tab-users').classList.toggle('hide', tab !== 'users');
  if (tab === 'users') loadUsers('');
}

/* ---------------- КИНО ---------------- */
async function loadMovies() {
  const el = document.getElementById('movieList');
  const { movies } = await api('/admin/movies');
  if (!movies.length) { el.innerHTML = '<p style="color:var(--muted)">Кино алга.</p>'; return; }
  el.innerHTML = `<table class="table"><thead><tr><th>Нэр</th><th>Он</th><th>Үйлдэл</th></tr></thead><tbody>
    ${movies.map((m) => `<tr>
      <td>${m.featured ? '⭐ ' : ''}${esc(m.title)}</td>
      <td>${m.year || '-'}</td>
      <td><div class="row-actions">
        <button class="btn btn-sm" onclick='selectMovie(${m.id})'>🎞 Анги</button>
        <button class="btn btn-sm" onclick='editMovie(${JSON.stringify(m).replace(/'/g, "&#39;")})'>✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id})">🗑</button>
      </div></td>
    </tr>`).join('')}</tbody></table>`;
}

async function uploadPosterIfAny() {
  const f = document.getElementById('m_poster_file').files[0];
  if (!f) return document.getElementById('m_poster_url').value.trim();
  const fd = new FormData();
  fd.append('poster', f);
  const res = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Зураг оруулж чадсангүй');
  return data.url;
}

async function saveMovie(e) {
  e.preventDefault();
  const msg = document.getElementById('movieMsg'); msg.className = 'msg';
  try {
    const poster_url = await uploadPosterIfAny();
    const body = {
      title: m_title.value, description: m_desc.value, poster_url,
      year: m_year.value, genre: m_genre.value, country: m_country.value,
      is_series: m_is_series.value === '1', featured: m_featured.checked,
    };
    const id = m_id.value;
    if (id) await api('/admin/movies/' + id, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/admin/movies', { method: 'POST', body: JSON.stringify(body) });
    msg.className = 'msg ok'; msg.textContent = 'Хадгаллаа ✅';
    resetMovieForm(); loadMovies();
  } catch (err) { msg.className = 'msg err'; msg.textContent = err.message; }
}

function editMovie(m) {
  m_id.value = m.id; m_title.value = m.title; m_desc.value = m.description || '';
  m_poster_url.value = m.poster_url || ''; m_year.value = m.year || '';
  m_genre.value = m.genre || ''; m_country.value = m.country || '';
  m_is_series.value = String(m.is_series); m_featured.checked = !!m.featured;
  document.getElementById('movieFormTitle').textContent = '✏️ Кино засах';
  document.getElementById('movieCancel').classList.remove('hide');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetMovieForm() {
  document.getElementById('movieForm').reset();
  m_id.value = '';
  document.getElementById('movieFormTitle').textContent = '➕ Шинэ кино нэмэх';
  document.getElementById('movieCancel').classList.add('hide');
}

async function deleteMovie(id) {
  if (!confirm('Энэ киног (бүх ангийн хамт) устгах уу?')) return;
  await api('/admin/movies/' + id, { method: 'DELETE' });
  loadMovies();
  if (SELECTED_MOVIE === id) document.getElementById('epArea').classList.add('hide');
}

/* ---------------- АНГИ ---------------- */
async function selectMovie(id) {
  SELECTED_MOVIE = id;
  e_movie_id.value = id;
  const { movies } = await api('/admin/movies');
  const m = movies.find((x) => x.id === id);
  document.getElementById('epTitle').textContent = `🎞 "${m.title}" — ангиуд`;
  document.getElementById('epArea').classList.remove('hide');
  resetEpForm();
  loadEpisodes(id);
  document.getElementById('epPanel').scrollIntoView({ behavior: 'smooth' });
}

async function loadEpisodes(id) {
  const { episodes } = await api('/admin/movies/' + id + '/episodes');
  const el = document.getElementById('epList');
  el.innerHTML = episodes.length
    ? `<table class="table"><thead><tr><th>#</th><th>Нэр</th><th>Төрөл</th><th>Үйлдэл</th></tr></thead><tbody>
        ${episodes.map((ep) => `<tr>
          <td>${ep.number}</td><td>${esc(ep.title || '-')}</td><td>${ep.video_type}</td>
          <td><div class="row-actions">
            <button class="btn btn-sm" onclick='editEp(${JSON.stringify(ep).replace(/'/g, "&#39;")})'>✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEp(${ep.id})">🗑</button>
          </div></td></tr>`).join('')}</tbody></table>`
    : '<p style="color:var(--muted)">Анги алга. Дээрх формоор нэмнэ үү.</p>';
}

async function saveEpisode(e) {
  e.preventDefault();
  const msg = document.getElementById('epMsg'); msg.className = 'msg';
  try {
    const body = {
      number: e_number.value, title: e_title.value, video_url: e_video_url.value,
      video_type: e_video_type.value, duration: e_duration.value,
    };
    const id = e_id.value;
    if (id) await api('/admin/episodes/' + id, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/admin/movies/' + SELECTED_MOVIE + '/episodes', { method: 'POST', body: JSON.stringify(body) });
    msg.className = 'msg ok'; msg.textContent = 'Анги хадгаллаа ✅';
    resetEpForm(); loadEpisodes(SELECTED_MOVIE);
  } catch (err) { msg.className = 'msg err'; msg.textContent = err.message; }
}

function editEp(ep) {
  e_id.value = ep.id; e_number.value = ep.number; e_title.value = ep.title || '';
  e_video_url.value = ep.video_url; e_video_type.value = ep.video_type; e_duration.value = ep.duration || '';
}
function resetEpForm() {
  e_id.value = ''; e_title.value = ''; e_video_url.value = ''; e_duration.value = '';
  e_video_type.value = 'file';
  const eps = document.querySelectorAll('#epList tr').length;
  e_number.value = eps || 1;
}
async function deleteEp(id) {
  if (!confirm('Энэ ангийг устгах уу?')) return;
  await api('/admin/episodes/' + id, { method: 'DELETE' });
  loadEpisodes(SELECTED_MOVIE);
}

/* ---------------- ХЭРЭГЛЭГЧ / VIP ---------------- */
async function loadUsers(q) {
  const el = document.getElementById('userList');
  const { users } = await api('/admin/users?q=' + encodeURIComponent(q || ''));
  el.innerHTML = `<table class="table"><thead>
    <tr><th>Нэр</th><th>И-мэйл</th><th>VIP</th><th>Эрх</th><th>Үйлдэл</th></tr></thead><tbody>
    ${users.map((u) => {
      const active = u.is_vip && (!u.vip_expires_at || new Date(u.vip_expires_at) > new Date());
      const exp = u.vip_expires_at ? new Date(u.vip_expires_at).toLocaleDateString('mn-MN') : (active ? 'хугацаагүй' : '');
      return `<tr>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td>${active ? `<span class="badge-vip">VIP</span><br><small style="color:var(--muted)">${exp}</small>` : '<span style="color:var(--muted)">Үгүй</span>'}</td>
        <td>${u.role === 'admin' ? '👑 Админ' : 'Хэрэглэгч'}</td>
        <td><div class="row-actions">
          <button class="btn btn-sm btn-gold" onclick="grantVip(${u.id})">+VIP</button>
          ${active ? `<button class="btn btn-sm btn-danger" onclick="revokeVip(${u.id})">VIP цуцлах</button>` : ''}
          <button class="btn btn-sm" onclick="toggleRole(${u.id}, '${u.role}')">${u.role === 'admin' ? 'Админ болих' : 'Админ болгох'}</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

async function grantVip(id) {
  const days = prompt('Хэдэн хоногийн VIP эрх олгох вэ?\n(0 бол хугацаагүй VIP)', '30');
  if (days === null) return;
  const msg = document.getElementById('userMsg'); msg.className = 'msg';
  try {
    await api('/admin/users/' + id + '/vip', { method: 'POST', body: JSON.stringify({ days: Number(days) }) });
    msg.className = 'msg ok'; msg.textContent = 'VIP эрх олголоо ✅';
    loadUsers(document.getElementById('userSearch').value);
  } catch (e) { msg.className = 'msg err'; msg.textContent = e.message; }
}
async function revokeVip(id) {
  if (!confirm('VIP эрхийг цуцлах уу?')) return;
  await api('/admin/users/' + id + '/vip', { method: 'DELETE' });
  loadUsers(document.getElementById('userSearch').value);
}
async function toggleRole(id, role) {
  const next = role === 'admin' ? 'user' : 'admin';
  if (!confirm(`Энэ хэрэглэгчийг "${next}" болгох уу?`)) return;
  await api('/admin/users/' + id + '/role', { method: 'POST', body: JSON.stringify({ role: next }) });
  loadUsers(document.getElementById('userSearch').value);
}

boot();
