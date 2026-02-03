import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../services/db.js';

export const authRouter = Router();

authRouter.get('/login', (req, res) => {
  if (req.user) return res.redirect('/payments');
  return res.render('login', { error: null });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query('SELECT id, email, password_hash FROM admins WHERE email = $1', [email]);
  const admin = result.rows[0];
  if (!admin) return res.status(401).render('login', { error: 'Invalid email or password' });

  const ok = bcrypt.compareSync(password || '', admin.password_hash);
  if (!ok) return res.status(401).render('login', { error: 'Invalid email or password' });

  req.session.user = { id: admin.id, email: admin.email };
  return res.redirect('/payments');
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});
