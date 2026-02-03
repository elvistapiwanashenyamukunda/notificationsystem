import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { initDb, query } from '../services/db.js';

dotenv.config();
await initDb();

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

try {
  await query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
  console.log('Admin created');
} catch (e) {
  console.error('Failed to create admin:', e.message);
  process.exit(1);
}
