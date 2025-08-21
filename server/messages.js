import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

let messages = []; // in-memory store, later DB

// Send message (user → admin)
router.post("/send", (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ error: "Missing userId or content" });
  }

  const msg = {
    id: uuidv4(),
    from: userId,
    to: "admin",
    content,
    date: new Date(),
    reply: null
  };
  messages.push(msg);

  res.json({ message: "Message sent", msg });
});

// Admin reply
router.post("/reply", (req, res) => {
  const { msgId, reply } = req.body;
  const msg = messages.find((m) => m.id === msgId);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  msg.reply = reply;
  res.json({ message: "Reply sent", msg });
});

// Get all messages for a user
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json(messages.filter((m) => m.from === userId || m.to === userId));
});

export default router;
