import dotenv from 'dotenv';
import { initDb } from './services/db.js';
import { ensureBootstrapAdmin } from './services/bootstrapAdmin.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

dotenv.config();
initDb();
ensureBootstrapAdmin();
startReminderScheduler();

// keep process alive
setInterval(() => {}, 60_000);
