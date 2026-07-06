const express = require('express');
const db = require('../db');
const { requireVip } = require('../auth');

const router = express.Router();

// Нүүр хуудас: шинэ кино + шинэ анги
router.get('/home', (_req, res) => {
  const featured = db
    .prepare(`SELECT * FROM movies WHERE featured = 1 ORDER BY updated_at DESC LIMIT 10`)
    .all();
  const latestMovies = db
    .prepare(`SELECT * FROM movies ORDER BY created_at DESC LIMIT 18`)
    .all();

  // Шинэ ангиуд (кино мэдээлэлтэй нь хамт)
  const latestEpisodes = db
    .prepare(
      `SELECT e.id as episode_id, e.number, e.title as episode_title, e.created_at,
              m.id as movie_id, m.title, m.poster_url
       FROM episodes e
       JOIN movies m ON m.id = e.movie_id
       ORDER BY e.created_at DESC
       LIMIT 12`
    )
    .all();

  res.json({ featured, latestMovies, latestEpisodes });
});

// Хайлт + жагсаалт
router.get('/movies', (req, res) => {
  const q = (req.query.q || '').trim();
  const genre = (req.query.genre || '').trim();
  let sql = `SELECT * FROM movies WHERE 1=1`;
  const params = [];
  if (q) {
    sql += ` AND (title LIKE ? OR description LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (genre) {
    sql += ` AND genre LIKE ?`;
    params.push(`%${genre}%`);
  }
  sql += ` ORDER BY created_at DESC LIMIT 60`;
  const movies = db.prepare(sql).all(...params);
  res.json({ movies });
});

// Нэг киноны дэлгэрэнгүй (постер, агуулга, ангийн жагсаалт)
// Видео линкийг ЭНД буцаахгүй — зөвхөн VIP watch endpoint-оос авна
router.get('/movies/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Кино олдсонгүй' });

  const episodes = db
    .prepare(
      `SELECT id, number, title, duration FROM episodes
       WHERE movie_id = ? ORDER BY number ASC`
    )
    .all(movie.id);

  res.json({ movie, episodes });
});

// Видео үзэх — ЗӨВХӨН VIP хэрэглэгч. Энд л video_url буцаана.
router.get('/watch/:episodeId', requireVip, (req, res) => {
  const ep = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.episodeId);
  if (!ep) return res.status(404).json({ error: 'Анги олдсонгүй' });
  const movie = db.prepare('SELECT id, title FROM movies WHERE id = ?').get(ep.movie_id);
  res.json({
    episode: {
      id: ep.id,
      number: ep.number,
      title: ep.title,
      video_url: ep.video_url,
      video_type: ep.video_type,
      duration: ep.duration,
    },
    movie,
  });
});

module.exports = router;
