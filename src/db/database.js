import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration for ELEVEA
const DB_PATH = path.join(process.cwd(), 'data', 'elevea.db');

let db = null;

export async function initDatabase() {
  if (db) return db;

  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }

    // Initialize SQLite database
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Load and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    db.exec(schema);
    
    console.log('✅ ELEVEA database initialized');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}