const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth, isVipActive } = require('../auth');

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd, // HTTPS дээр л cookie илгээнэ
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_vip: isVipActive(u) ? 1 : 0,
    vip_expires_at: u.vip_expires_at || null,
  };
}

// Бүртгүүлэх
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' });
  if (String(password).length < 6)
    return res.status(400).json({ error: 'Нууц үг доод тал нь 6 тэмдэгт байна' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Энэ и-мэйл бүртгэлтэй байна' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ token, user: publicUser(user) });
});

// Нэвтрэх
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'И-мэйл болон нууц үгээ оруулна уу' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(String(password), user.password_hash))
    return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу байна' });

  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ token, user: publicUser(user) });
});

// Гарах
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: undefined });
  res.json({ ok: true });
});

// Одоогийн хэрэглэгч
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
