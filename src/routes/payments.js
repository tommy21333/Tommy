const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

/*
 * Төлбөрийн бүтэц — дараа нь QPay / SocialPay-г ЭНД холбоно.
 * Одоогоор "manual" горим: хэрэглэгч VIP хүсэлт үүсгэнэ, админ гараар баталгаажуулна.
 *
 * QPay нэмэх алхам (дараа нь):
 *   1. POST /api/payments/qpay/create  -> QPay-ийн /invoice руу хүсэлт илгээж QR буцаана
 *   2. QPay callback (webhook) -> /api/payments/qpay/callback -> status='paid' болгож VIP олгоно
 * SocialPay мөн адил бүтэцтэй.
 */

const VIP_PLANS = [
  { id: 'm1', name: '1 сар', days: 30, amount: 15000 },
  { id: 'm3', name: '3 сар', days: 90, amount: 39000 },
  { id: 'm12', name: '1 жил', days: 365, amount: 120000 },
];

// VIP багцуудыг харах
router.get('/plans', (_req, res) => {
  res.json({ plans: VIP_PLANS });
});

// VIP хүсэлт үүсгэх (одоогоор гараар баталгаажуулах хүлээгдэж буй бичлэг)
router.post('/request', requireAuth, (req, res) => {
  const planId = req.body?.plan;
  const plan = VIP_PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Багц сонгоно уу' });

  const info = db
    .prepare(
      `INSERT INTO payments (user_id, amount, provider, status, vip_days)
       VALUES (?, ?, 'manual', 'pending', ?)`
    )
    .run(req.user.id, plan.amount, plan.days);

  res.json({
    ok: true,
    payment_id: info.lastInsertRowid,
    message:
      'Хүсэлт хүлээн авлаа. Төлбөр төлсний дараа админтай холбогдоно уу. Админ таны VIP эрхийг идэвхжүүлнэ.',
  });
});

// Хэрэглэгчийн төлбөрийн түүх
router.get('/my', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, amount, provider, status, vip_days, created_at, paid_at FROM payments WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ payments: rows });
});

/* ---- QPay / SocialPay-ийн ирээдүйн орох цэгүүд (одоогоор идэвхгүй) ----
router.post('/qpay/create', requireAuth, async (req, res) => { ... });
router.post('/qpay/callback', async (req, res) => { ... });
router.post('/socialpay/create', requireAuth, async (req, res) => { ... });
router.post('/socialpay/callback', async (req, res) => { ... });
*/

module.exports = router;
