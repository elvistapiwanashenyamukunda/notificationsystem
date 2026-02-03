import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db;

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function initDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/app.db';
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      due_date TEXT NOT NULL,
      reminder_days_before TEXT,
      notes TEXT,
      created_by_admin_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS reminders_sent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      remind_on TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      UNIQUE(payment_id, remind_on),
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    );
  `);

  const paymentCols = db.prepare("PRAGMA table_info('payments')").all();
  const hasReminderDaysBefore = paymentCols.some((c) => c.name === 'reminder_days_before');
  if (!hasReminderDaysBefore) {
    db.exec('ALTER TABLE payments ADD COLUMN reminder_days_before TEXT');
  }

  return db;
}
