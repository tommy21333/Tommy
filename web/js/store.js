/* ============================================================
   Frontend-only дата давхарга — бүх мэдээллийг browser-ийн
   localStorage-д хадгална. Сервер шаардахгүй.
   ⚠️ Энэ нь ЗӨВХӨН frontend демо. Нууц үг, VIP шалгалт нь браузер
      дотор хийгддэг тул жинхэнэ найдвартай хамгаалалт биш.
      Бодит хамгаалалт хэрэгтэй бол backend хувилбарыг (root дахь)
      ашиглана уу.
   ============================================================ */
const Store = (() => {
  const K = { users: 'mv_users', movies: 'mv_movies', eps: 'mv_episodes', session: 'mv_session', seq: 'mv_seq' };

  const read = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const nextId = () => { const n = (read(K.seq, 0) || 0) + 1; write(K.seq, n); return n; };

  // ---------- Анхны өгөгдөл ----------
  function seed() {
    if (read(K.users, null)) return; // аль хэдийн үүссэн
    write(K.seq, 0);
    const adminId = nextId();
    write(K.users, [{
      id: adminId, name: 'Админ', email: 'admin@movie.mn',
      password: 'admin123', role: 'admin', is_vip: 1, vip_expires_at: null,
      created_at: new Date().toISOString(),
    }]);

    const m1 = nextId();
    write(K.movies, [{
      id: m1, title: 'Жишээ Кино', is_series: 1, featured: 1,
      description: 'Энэ бол админ панелаар кино нэмэх жишээ. Постер, товч агуулга, ангийн жагсаалттай.',
      poster_url: '', year: 2024, genre: 'Адал явдалт', country: 'Монгол',
      created_at: new Date().toISOString(),
    }]);
    write(K.eps, [
      { id: nextId(), movie_id: m1, number: 1, title: '1-р анги', duration: '9:56',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        video_type: 'file', created_at: new Date().toISOString() },
      { id: nextId(), movie_id: m1, number: 2, title: '2-р анги', duration: '10:53',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        video_type: 'file', created_at: new Date().toISOString() },
    ]);
  }

  // ---------- Туслах ----------
  const users = () => read(K.users, []);
  const movies = () => read(K.movies, []);
  const episodes = () => read(K.eps, []);
  const saveUsers = (v) => write(K.users, v);
  const saveMovies = (v) => write(K.movies, v);
  const saveEps = (v) => write(K.eps, v);

  function vipActive(u) {
    if (!u || !u.is_vip) return false;
    if (u.role === 'admin') return true;
    if (!u.vip_expires_at) return true;
    return new Date(u.vip_expires_at).getTime() > Date.now();
  }

  // ---------- Session / auth ----------
  function current() {
    const id = read(K.session, null);
    if (!id) return null;
    return users().find((u) => u.id === id) || null;
  }
  function register(name, email, password) {
    if (!name || !email || !password) throw new Error('Бүх талбарыг бөглөнө үү');
    if (String(password).length < 6) throw new Error('Нууц үг доод тал нь 6 тэмдэгт');
    const list = users();
    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('Энэ и-мэйл бүртгэлтэй байна');
    const u = { id: nextId(), name, email, password, role: 'user', is_vip: 0, vip_expires_at: null, created_at: new Date().toISOString() };
    list.push(u); saveUsers(list); write(K.session, u.id);
    return u;
  }
  function login(email, password) {
    const u = users().find((x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === password);
    if (!u) throw new Error('И-мэйл эсвэл нууц үг буруу байна');
    write(K.session, u.id);
    return u;
  }
  function logout() { localStorage.removeItem(K.session); }
  const isVip = (u) => vipActive(u || current());

  // ---------- Нүүр / жагсаалт / хайлт ----------
  function home() {
    const mv = movies();
    const featured = mv.filter((m) => m.featured).slice(-10).reverse();
    const latestMovies = [...mv].reverse().slice(0, 18);
    const latestEpisodes = [...episodes()].reverse().slice(0, 12).map((e) => {
      const m = mv.find((x) => x.id === e.movie_id) || {};
      return { episode_id: e.id, number: e.number, episode_title: e.title, movie_id: e.movie_id, title: m.title || '', poster_url: m.poster_url || '' };
    });
    return { featured, latestMovies, latestEpisodes };
  }
  function search(q, genre) {
    q = (q || '').toLowerCase().trim();
    return movies().filter((m) => {
      const okQ = !q || (m.title + ' ' + (m.description || '')).toLowerCase().includes(q);
      const okG = !genre || (m.genre || '').toLowerCase().includes(genre.toLowerCase());
      return okQ && okG;
    }).reverse();
  }
  function getMovie(id) {
    id = Number(id);
    const m = movies().find((x) => x.id === id);
    if (!m) return null;
    const eps = episodes().filter((e) => e.movie_id === id).sort((a, b) => a.number - b.number);
    return { movie: m, episodes: eps };
  }
  // VIP шалгалт — үзэх эрх
  function watch(episodeId) {
    const u = current();
    if (!u) return { locked: 'login' };
    if (!isVip(u)) return { locked: 'vip' };
    const ep = episodes().find((e) => e.id === Number(episodeId));
    if (!ep) throw new Error('Анги олдсонгүй');
    return { episode: ep };
  }

  // ---------- Админ: кино ----------
  function requireAdmin() { const u = current(); if (!u || u.role !== 'admin') throw new Error('Админ эрх шаардлагатай'); return u; }
  function adminMovies() { requireAdmin(); return [...movies()].reverse(); }
  function saveMovie(data) {
    requireAdmin();
    const list = movies();
    if (data.id) {
      const i = list.findIndex((m) => m.id === Number(data.id));
      if (i < 0) throw new Error('Кино олдсонгүй');
      list[i] = { ...list[i], ...data, id: list[i].id, is_series: data.is_series ? 1 : 0, featured: data.featured ? 1 : 0, year: data.year ? Number(data.year) : null };
    } else {
      list.push({ id: nextId(), title: data.title, description: data.description || '', poster_url: data.poster_url || '',
        year: data.year ? Number(data.year) : null, genre: data.genre || '', country: data.country || '',
        is_series: data.is_series ? 1 : 0, featured: data.featured ? 1 : 0, created_at: new Date().toISOString() });
    }
    saveMovies(list);
  }
  function deleteMovie(id) {
    requireAdmin(); id = Number(id);
    saveMovies(movies().filter((m) => m.id !== id));
    saveEps(episodes().filter((e) => e.movie_id !== id));
  }

  // ---------- Админ: анги ----------
  function movieEpisodes(movieId) { requireAdmin(); return episodes().filter((e) => e.movie_id === Number(movieId)).sort((a, b) => a.number - b.number); }
  function saveEpisode(movieId, data) {
    requireAdmin();
    const list = episodes();
    if (data.id) {
      const i = list.findIndex((e) => e.id === Number(data.id));
      if (i < 0) throw new Error('Анги олдсонгүй');
      list[i] = { ...list[i], ...data, id: list[i].id, number: Number(data.number) || 1 };
    } else {
      if (!data.video_url) throw new Error('Видео линк шаардлагатай');
      list.push({ id: nextId(), movie_id: Number(movieId), number: Number(data.number) || 1, title: data.title || '',
        video_url: data.video_url, video_type: data.video_type || 'file', duration: data.duration || '', created_at: new Date().toISOString() });
    }
    saveEps(list);
  }
  function deleteEpisode(id) { requireAdmin(); saveEps(episodes().filter((e) => e.id !== Number(id))); }

  // ---------- Админ: хэрэглэгч / VIP ----------
  function adminUsers(q) {
    requireAdmin(); q = (q || '').toLowerCase();
    return [...users()].reverse().filter((u) => !q || (u.name + ' ' + u.email).toLowerCase().includes(q))
      .map((u) => ({ ...u, password: undefined }));
  }
  function grantVip(id, days) {
    requireAdmin(); id = Number(id);
    const list = users(); const u = list.find((x) => x.id === id);
    if (!u) throw new Error('Хэрэглэгч олдсонгүй');
    let expires = null;
    if (days && days > 0) {
      const base = u.is_vip && u.vip_expires_at && new Date(u.vip_expires_at) > new Date() ? new Date(u.vip_expires_at) : new Date();
      base.setDate(base.getDate() + days); expires = base.toISOString();
    }
    u.is_vip = 1; u.vip_expires_at = expires; saveUsers(list);
  }
  function revokeVip(id) {
    requireAdmin(); id = Number(id);
    const list = users(); const u = list.find((x) => x.id === id);
    if (u) { u.is_vip = 0; u.vip_expires_at = null; saveUsers(list); }
  }
  function setRole(id, role) {
    requireAdmin(); id = Number(id);
    const list = users(); const u = list.find((x) => x.id === id);
    if (u) { u.role = role === 'admin' ? 'admin' : 'user'; saveUsers(list); }
  }

  seed();
  return { current, register, login, logout, isVip, vipActive, home, search, getMovie, watch,
    adminMovies, saveMovie, deleteMovie, movieEpisodes, saveEpisode, deleteEpisode,
    adminUsers, grantVip, revokeVip, setRole };
})();
