import bcrypt from 'bcryptjs';
import { query } from './db.js';

export async function ensureBootstrapAdmin() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim();
  const password = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();

  if (!email || !password) return;

  const existing = await query('SELECT id FROM admins WHERE email = $1', [email]);
  if (existing.rowCount > 0) return;

  const hash = bcrypt.hashSync(password, 10);
  await query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
}
