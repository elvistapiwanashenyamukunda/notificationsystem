import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

export function ensureBootstrapAdmin() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim();
  const password = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();

  if (!email || !password) return;

  const db = getDb();
  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (email, password_hash, created_at) VALUES (?, ?, ?)').run(
    email,
    hash,
    new Date().toISOString()
  );
}
