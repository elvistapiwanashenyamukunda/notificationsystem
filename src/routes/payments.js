import { Router } from 'express';
import { getDb } from '../services/db.js';

export const paymentsRouter = Router();

function parseAmountToCents(amountStr) {
  const n = Number(amountStr);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

paymentsRouter.get('/', (req, res) => {
  const db = getDb();
  const payments = db
    .prepare(
      `SELECT id, title, counterparty, amount_cents, currency, due_date, reminder_days_before, notes
       FROM payments
       ORDER BY due_date ASC, id DESC`
    )
    .all();

  return res.render('payments/index', { user: req.user, payments });
});

paymentsRouter.get('/new', (req, res) => {
  return res.render('payments/new', { user: req.user, error: null, form: {} });
});

paymentsRouter.post('/new', (req, res) => {
  const { title, counterparty, amount, currency, due_date, notes, reminder_days_before } = req.body;
  const amountCents = parseAmountToCents(amount);

  if (!title || !counterparty || amountCents === null || !currency || !due_date) {
    return res.status(400).render('payments/new', {
      user: req.user,
      error: 'Please fill all required fields with valid values',
      form: req.body,
    });
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO payments (title, counterparty, amount_cents, currency, due_date, reminder_days_before, notes, created_by_admin_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    title,
    counterparty,
    amountCents,
    currency,
    due_date,
    (reminder_days_before || '').trim() || null,
    notes || null,
    req.user.id,
    new Date().toISOString()
  );

  return res.redirect('/payments');
});

paymentsRouter.post('/:id/delete', (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  db.prepare('DELETE FROM reminders_sent WHERE payment_id = ?').run(id);
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  return res.redirect('/payments');
});
