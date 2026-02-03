import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDb } from './services/db.js';
import { ensureBootstrapAdmin } from './services/bootstrapAdmin.js';
import { authRouter } from './routes/auth.js';
import { paymentsRouter } from './routes/payments.js';
import { requireAuth } from './middleware/requireAuth.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, _res, next) => {
  req.user = req.session.user || null;
  next();
});

await initDb();
await ensureBootstrapAdmin();
if (String(process.env.ENABLE_SCHEDULER || 'false') === 'true') {
  startReminderScheduler();
}

app.get('/', (req, res) => {
  if (!req.user) return res.redirect('/login');
  return res.redirect('/payments');
});

app.use(authRouter);
app.use('/payments', requireAuth, paymentsRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // no console comments by request; keep minimal
  console.log(`Server running on http://localhost:${port}`);
});
