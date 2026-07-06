const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Токеноос хэрэглэгчийг олж req.user-д хийнэ (заавал биш)
function loadUser(req, _res, next) {
  const token =
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db
        .prepare('SELECT id, name, email, role, is_vip, vip_expires_at FROM users WHERE id = ?')
        .get(payload.id);
      if (user) req.user = user;
    } catch (_e) {
      /* хүчингүй токен — зочин гэж үзнэ */
    }
  }
  next();
}

// Нэвтэрсэн байх шаардлагатай
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  next();
}

// Админ эрх шаардлагатай
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Админ эрх шаардлагатай' });
  next();
}

// VIP эрх идэвхтэй эсэхийг шалгах
function isVipActive(user) {
  if (!user || !user.is_vip) return false;
  if (!user.vip_expires_at) return true; // хугацаагүй VIP
  return new Date(user.vip_expires_at).getTime() > Date.now();
}

// Зөвхөн VIP кино үзэх боломжтой
function requireVip(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  if (req.user.role === 'admin') return next(); // админ бүх киног үзнэ
  if (!isVipActive(req.user))
    return res
      .status(403)
      .json({ error: 'VIP эрх шаардлагатай', code: 'VIP_REQUIRED' });
  next();
}

module.exports = {
  JWT_SECRET,
  signToken,
  loadUser,
  requireAuth,
  requireAdmin,
  requireVip,
  isVipActive,
};
