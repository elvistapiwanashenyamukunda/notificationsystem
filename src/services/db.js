import pg from 'pg';

let pool;

export function getPool() {
  if (!pool) throw new Error('DB not initialized');
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

export async function initDb() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL must be set');

  pool = new pg.Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      due_date DATE NOT NULL,
      reminder_days_before TEXT,
      notes TEXT,
      created_by_admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reminders_sent (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      remind_on DATE NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(payment_id, remind_on)
    );
  `);

  await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS reminder_days_before TEXT');

  return pool;
}

export async function closeDb() {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end();
}
