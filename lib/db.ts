import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'advoost.db');

let _db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!_db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function initDB(): void {
  const db = getDB();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      email          TEXT    UNIQUE NOT NULL,
      password_hash  TEXT    NOT NULL,
      name           TEXT    NOT NULL,
      plan           TEXT    DEFAULT 'free' CHECK(plan IN ('free','pro','enterprise')),
      monthly_limit  INTEGER DEFAULT 10,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      keyword         TEXT    NOT NULL,
      ad_title        TEXT    NOT NULL,
      ad_desc         TEXT    NOT NULL,
      landing_content TEXT    NOT NULL,
      overall_score   REAL,
      result_json     TEXT    NOT NULL,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_usage (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      year_month TEXT    NOT NULL,
      count      INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, year_month)
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_date ON analyses(created_at DESC);
  `);
}

export function getYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export type User = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  monthly_limit: number;
  created_at: string;
};

export type SafeUser = Omit<User, 'password_hash'>;

export type Analysis = {
  id: number;
  user_id: number;
  keyword: string;
  ad_title: string;
  ad_desc: string;
  landing_content: string;
  overall_score: number | null;
  result_json: string;
  created_at: string;
};
