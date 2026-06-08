import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first, then allow backend/.env to override if it exists.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const PORT = process.env.PORT || 8000;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
