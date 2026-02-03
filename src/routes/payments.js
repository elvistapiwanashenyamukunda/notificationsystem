import { Router } from 'express';
import { query } from '../services/db.js';

export const paymentsRouter = Router();

function parseAmountToCents(amountStr) {
  const n = Number(amountStr);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

paymentsRouter.get('/', async (req, res) => {
  const result = await query(
    `SELECT id, title, counterparty, amount_cents, currency, due_date, reminder_days_before, notes
     FROM payments
     ORDER BY due_date ASC, id DESC`
  );
  const payments = result.rows.map((p) => ({
    ...p,
    due_date: p.due_date instanceof Date ? p.due_date.toISOString().slice(0, 10) : p.due_date,
  }));

  return res.render('payments/index', { user: req.user, payments });
});

paymentsRouter.get('/new', (req, res) => {
  return res.render('payments/new', { user: req.user, error: null, form: {} });
});

paymentsRouter.post('/new', async (req, res) => {
  const { title, counterparty, amount, currency, due_date, notes, reminder_days_before } = req.body;
  const amountCents = parseAmountToCents(amount);

  if (!title || !counterparty || amountCents === null || !currency || !due_date) {
    return res.status(400).render('payments/new', {
      user: req.user,
      error: 'Please fill all required fields with valid values',
      form: req.body,
    });
  }

  await query(
    `INSERT INTO payments (title, counterparty, amount_cents, currency, due_date, reminder_days_before, notes, created_by_admin_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      title,
      counterparty,
      amountCents,
      currency,
      due_date,
      (reminder_days_before || '').trim() || null,
      notes || null,
      req.user.id,
    ]
  );

  return res.redirect('/payments');
});

paymentsRouter.post('/:id/delete', async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM reminders_sent WHERE payment_id = $1', [id]);
  await query('DELETE FROM payments WHERE id = $1', [id]);
  return res.redirect('/payments');
});
