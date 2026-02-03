import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { initDb, getDb } from '../services/db.js';

dotenv.config();
initDb();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

const email = (await question('Admin email: ')).trim();
const password = (await question('Admin password: ')).trim();
rl.close();

if (!email || !password) {
  console.error('Email and password are required');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const db = getDb();

try {
  db.prepare('INSERT INTO admins (email, password_hash, created_at) VALUES (?, ?, ?)').run(
    email,
    hash,
    new Date().toISOString()
  );
  console.log('Admin created');
} catch (e) {
  console.error('Failed to create admin:', e.message);
  process.exit(1);
}
