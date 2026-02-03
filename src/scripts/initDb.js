import dotenv from 'dotenv';
import { initDb } from '../services/db.js';

dotenv.config();
await initDb();
console.log('DB initialized');
