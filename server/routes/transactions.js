// server/routes/transactions.js
import express from "express";
import { getDb } from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// deposit funds
router.post("/deposit", auth, async (req, res) => {
  const { amount } = req.body;
  const db = getDb();
  try {
    await db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, req.user.id]);
    res.json({ message: "Deposit successful" });
  } catch {
    res.status(400).json({ error: "Deposit failed" });
  }
});

// withdraw funds
router.post("/withdraw", auth, async (req, res) => {
  const { amount } = req.body;
  const db = getDb();

  const user = await db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id]);
  if (!user || user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  try {
    await db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, req.user.id]);
    res.json({ message: "Withdrawal successful" });
  } catch {
    res.status(400).json({ error: "Withdrawal failed" });
  }
});

export default router;
