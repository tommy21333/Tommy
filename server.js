require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { loadUser } = require('./src/auth');
require('./src/db'); // DB инициалчлах
require('./src/seed')(); // анхны админ + жишээ өгөгдөл

const app = express();
const PORT = process.env.PORT || 3000;

// HTTPS ард proxy (nginx/hosting) байвал secure cookie зөв ажиллана
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loadUser);

// Нэвтрэх/бүртгэлийн brute-force хамгаалалт
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Хэт олон оролдлого. Түр хүлээнэ үү.' },
});

// Нийтийн тохиргоо (нүүрэнд харагдах холбоос)
app.get('/api/config', (_req, res) => {
  res.json({
    siteName: process.env.SITE_NAME || 'MovieVIP',
    facebook: process.env.FACEBOOK_URL || '',
    telegram: process.env.TELEGRAM_URL || '',
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Маршрутууд
app.use('/api/auth', authLimiter, require('./src/routes/auth'));
app.use('/api', require('./src/routes/movies'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/payments', require('./src/routes/payments'));

// Статик frontend
app.use(express.static(path.join(__dirname, 'public')));

// Multer болон бусад алдааг цэвэрхэн буцаах
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Серверийн алдаа' });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер аслаа:  http://localhost:${PORT}`);
});
