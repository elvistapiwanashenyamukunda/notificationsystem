import cron from 'node-cron';
import { query } from './db.js';
import { sendMail } from './mailer.js';

function parseDaysBefore() {
  const raw = process.env.REMINDER_DAYS_BEFORE || '7,3,1,0';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

function parseDaysBeforeRaw(raw) {
  if (!raw) return null;
  const list = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return list.length ? list : null;
}

function dateOnlyISO(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDateString(dateOrString) {
  if (dateOrString instanceof Date) return dateOrString.toISOString().slice(0, 10);
  return String(dateOrString).slice(0, 10);
}

async function runOnce() {
  const defaultDaysBeforeList = parseDaysBefore();

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const paymentsResult = await query(
    `SELECT p.id, p.title, p.counterparty, p.amount_cents, p.currency, p.due_date, p.reminder_days_before, a.email as admin_email
     FROM payments p
     JOIN admins a ON a.id = p.created_by_admin_id`
  );
  const payments = paymentsResult.rows;

  for (const p of payments) {
    const list = parseDaysBeforeRaw(p.reminder_days_before) || defaultDaysBeforeList;

    const dueDateIso = toIsoDateString(p.due_date);
    const dueDateMidnightUtc = new Date(dueDateIso + 'T00:00:00Z');

    for (const daysBefore of list) {
      const remindOnDate = addDays(dueDateMidnightUtc, -daysBefore);
      const remindOnIso = dateOnlyISO(remindOnDate);
      if (remindOnIso !== dateOnlyISO(today)) continue;

      const already = await query(
        'SELECT 1 FROM reminders_sent WHERE payment_id = $1 AND remind_on = $2',
        [p.id, remindOnIso]
      );
      if (already.rowCount > 0) continue;

      const amount = (p.amount_cents / 100).toFixed(2);
      const subject = `Payment reminder: ${p.title} due ${dueDateIso}`;
      const text =
        `Payment reminder.\n\n` +
        `Title: ${p.title}\n` +
        `Counterparty: ${p.counterparty}\n` +
        `Amount: ${amount} ${p.currency}\n` +
        `Due date: ${dueDateIso}\n`;

      await sendMail({ to: p.admin_email, subject, text });

      await query('INSERT INTO reminders_sent (payment_id, remind_on) VALUES ($1, $2)', [p.id, remindOnIso]);
    }
  }
}

export function startReminderScheduler() {
  // Every day at 08:00 server time
  cron.schedule('0 8 * * *', () => {
    runOnce().catch((e) => console.error('Reminder job failed', e));
  });

  // Also run shortly after boot (useful in dev)
  setTimeout(() => {
    runOnce().catch((e) => console.error('Initial reminder run failed', e));
  }, 3000);
}
