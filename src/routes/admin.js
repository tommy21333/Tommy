const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

// ---- Постер зураг оруулах тохиргоо ----
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = 'poster_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Зөвхөн зураг оруулна уу'));
  },
});

// Бүх маршрут админ эрх шаардана
router.use(requireAdmin);

// ---- Постер оруулах ----
router.post('/upload', upload.single('poster'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Зураг сонгоно уу' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ---- Кино ----
router.get('/movies', (_req, res) => {
  const movies = db.prepare('SELECT * FROM movies ORDER BY created_at DESC').all();
  res.json({ movies });
});

router.post('/movies', (req, res) => {
  const { title, description, poster_url, year, genre, country, is_series, featured } =
    req.body || {};
  if (!title) return res.status(400).json({ error: 'Киноны нэр шаардлагатай' });
  const info = db
    .prepare(
      `INSERT INTO movies (title, description, poster_url, year, genre, country, is_series, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      description || '',
      poster_url || '',
      year ? Number(year) : null,
      genre || '',
      country || '',
      is_series ? 1 : 0,
      featured ? 1 : 0
    );
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(info.lastInsertRowid);
  res.json({ movie });
});

router.put('/movies/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Кино олдсонгүй' });
  const { title, description, poster_url, year, genre, country, is_series, featured } = {
    ...m,
    ...req.body,
  };
  db.prepare(
    `UPDATE movies SET title=?, description=?, poster_url=?, year=?, genre=?, country=?,
       is_series=?, featured=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    title,
    description || '',
    poster_url || '',
    year ? Number(year) : null,
    genre || '',
    country || '',
    is_series ? 1 : 0,
    featured ? 1 : 0,
    m.id
  );
  res.json({ movie: db.prepare('SELECT * FROM movies WHERE id = ?').get(m.id) });
});

router.delete('/movies/:id', (req, res) => {
  db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- Анги ----
router.get('/movies/:id/episodes', (req, res) => {
  const episodes = db
    .prepare('SELECT * FROM episodes WHERE movie_id = ? ORDER BY number ASC')
    .all(req.params.id);
  res.json({ episodes });
});

router.post('/movies/:id/episodes', (req, res) => {
  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Кино олдсонгүй' });
  const { number, title, video_url, video_type, duration } = req.body || {};
  if (!video_url) return res.status(400).json({ error: 'Видео линк шаардлагатай' });
  const info = db
    .prepare(
      `INSERT INTO episodes (movie_id, number, title, video_url, video_type, duration)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      movie.id,
      number ? Number(number) : 1,
      title || '',
      video_url,
      video_type || 'file',
      duration || ''
    );
  res.json({ episode: db.prepare('SELECT * FROM episodes WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/episodes/:id', (req, res) => {
  const ep = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
  if (!ep) return res.status(404).json({ error: 'Анги олдсонгүй' });
  const { number, title, video_url, video_type, duration } = { ...ep, ...req.body };
  db.prepare(
    `UPDATE episodes SET number=?, title=?, video_url=?, video_type=?, duration=? WHERE id=?`
  ).run(Number(number) || 1, title || '', video_url, video_type || 'file', duration || '', ep.id);
  res.json({ episode: db.prepare('SELECT * FROM episodes WHERE id = ?').get(ep.id) });
});

router.delete('/episodes/:id', (req, res) => {
  db.prepare('DELETE FROM episodes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- Хэрэглэгч / VIP гараар олгох ----
router.get('/users', (req, res) => {
  const q = (req.query.q || '').trim();
  let sql = `SELECT id, name, email, role, is_vip, vip_expires_at, created_at FROM users`;
  const params = [];
  if (q) {
    sql += ` WHERE name LIKE ? OR email LIKE ?`;
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY created_at DESC LIMIT 200`;
  res.json({ users: db.prepare(sql).all(...params) });
});

// VIP эрх олгох (хоногоор). days=0 бол хугацаагүй VIP.
router.post('/users/:id/vip', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
  const days = Number(req.body?.days);

  let expires = null;
  if (days && days > 0) {
    // Хэрэв идэвхтэй VIP байвал үлдсэн хугацаан дээр нэмнэ
    const base =
      user.is_vip && user.vip_expires_at && new Date(user.vip_expires_at) > new Date()
        ? new Date(user.vip_expires_at)
        : new Date();
    base.setDate(base.getDate() + days);
    expires = base.toISOString();
  }
  db.prepare('UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?').run(expires, user.id);

  // Гараар олгосон төлбөрийн бичлэг үлдээх
  db.prepare(
    `INSERT INTO payments (user_id, amount, provider, status, vip_days, paid_at)
     VALUES (?, 0, 'manual', 'paid', ?, datetime('now'))`
  ).run(user.id, days || 0);

  res.json({ user: db.prepare('SELECT id, name, email, role, is_vip, vip_expires_at FROM users WHERE id = ?').get(user.id) });
});

// VIP эрх цуцлах
router.delete('/users/:id/vip', (req, res) => {
  db.prepare('UPDATE users SET is_vip = 0, vip_expires_at = NULL WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Хэрэглэгчийг админ болгох / буцаах
router.post('/users/:id/role', (req, res) => {
  const role = req.body?.role === 'admin' ? 'admin' : 'user';
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true, role });
});

module.exports = router;
