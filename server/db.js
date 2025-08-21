/**
 * server/db.js
 * Lightweight SQLite helper - creates tables if missing.
 */

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// db file within server folder
const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, "profitbliss.db");

export let db; // will be the open Database

export async function initDb() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec("PRAGMA foreign_keys = ON;");

  // Users table
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    verified INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    balance REAL DEFAULT 0,
    referral TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // verify tokens
  await db.exec(`CREATE TABLE IF NOT EXISTS verify_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  // deposits
  await db.exec(`CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    method TEXT,
    txid TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  // withdrawals
  await db.exec(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    address TEXT,
    chain TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  // plans
  await db.exec(`CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    stake REAL,
    daily_roi REAL,
    duration_days INTEGER DEFAULT 30
  );`);

  // active plans
  await db.exec(`CREATE TABLE IF NOT EXISTS active_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan_id INTEGER,
    plan_name TEXT,
    stake REAL,
    daily_roi REAL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ends_at DATETIME,
    last_credited_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
  );`);

  // messages (contact + chat)
  await db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    email TEXT,
    subject TEXT,
    body TEXT,
    from_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  // seed basic plans and demo accounts if not exist
  const plans = await db.all("SELECT * FROM plans LIMIT 1");
  if (plans.length === 0) {
    await db.run("INSERT INTO plans (name, stake, daily_roi, duration_days) VALUES (?, ?, ?, ?)",
      "Basic", 50, 20, 30);
    await db.run("INSERT INTO plans (name, stake, daily_roi, duration_days) VALUES (?, ?, ?, ?)",
      "Gold", 100, 35, 30);
    await db.run("INSERT INTO plans (name, stake, daily_roi, duration_days) VALUES (?, ?, ?, ?)",
      "Master", 200, 50, 30);
    await db.run("INSERT INTO plans (name, stake, daily_roi, duration_days) VALUES (?, ?, ?, ?)",
      "Premium", 300, 75, 30);
    console.log("Seeded plans");
  }

  // seed admin and demo user
  const admin = await db.get("SELECT id FROM users WHERE email = ?", "admin@profitbliss.com");
  if (!admin) {
    const bcrypt = await import("bcryptjs");
    const pwHash = bcrypt.hashSync("admin123", 10);
    await db.run("INSERT INTO users (email, password, verified, is_admin, balance) VALUES (?, ?, ?, ?, ?)",
      "admin@profitbliss.com", pwHash, 1, 1, 0);
    console.log("Seeded admin@profitbliss.com / admin123");
  }
  const demo = await db.get("SELECT id FROM users WHERE email = ?", "user@profitbliss.com");
  if (!demo) {
    const bcrypt = await import("bcryptjs");
    const pwHash = bcrypt.hashSync("password123", 10);
    await db.run("INSERT INTO users (email, password, verified, is_admin, balance) VALUES (?, ?, ?, ?, ?)",
      "user@profitbliss.com", pwHash, 1, 0, 500);
    console.log("Seeded user@profitbliss.com / password123 (balance $500)");
  }

  console.log("DB initialized:", DB_FILE);
}
