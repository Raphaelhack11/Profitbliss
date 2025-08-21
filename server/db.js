// server/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db;

export async function initDb() {
  db = await open({
    filename: "./data.sqlite",
    driver: sqlite3.Database
  });

  // create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      verified INTEGER DEFAULT 0,
      referral TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // simple messages table (for contact/chat)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT,
      is_admin_reply INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // active plans table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      plan_name TEXT,
      stake REAL,
      daily_roi REAL,
      duration_days INTEGER,
      start_date DATETIME,
      end_date DATETIME,
      active INTEGER DEFAULT 1
    );
  `);

  console.log("✅ SQLite database initialized");
}

export function getDb() {
  if (!db) throw new Error("Database not initialized!");
  return db;
}
