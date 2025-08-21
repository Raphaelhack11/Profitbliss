// server/routes/messages.js
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

// send message
router.post("/", auth, async (req, res) => {
  const { content } = req.body;
  const db = getDb();
  try {
    await db.run(`INSERT INTO messages (user_id, content) VALUES (?,?)`, [req.user.id, content]);
    res.json({ message: "Message sent" });
  } catch {
    res.status(400).json({ error: "Failed to send message" });
  }
});

// get my messages
router.get("/my", auth, async (req, res) => {
  const db = getDb();
  const msgs = await db.all(`SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]);
  res.json(msgs);
});

export default router;
