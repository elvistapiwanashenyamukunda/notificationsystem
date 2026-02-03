import dotenv from 'dotenv';
import { initDb } from '../services/db.js';

dotenv.config();
initDb();
console.log('DB initialized');
