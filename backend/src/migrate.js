import { pool } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'sql', 'add_product_units.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration: add_product_units.sql');
    await pool.query(sql);
    console.log('✓ Migration completed successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
