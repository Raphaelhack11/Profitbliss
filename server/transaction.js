import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

let transactions = []; // simple in-memory, replace with DB

// Deposit
router.post("/deposit", (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ error: "Missing userId or amount" });
  }

  const tx = {
    id: uuidv4(),
    type: "deposit",
    userId,
    amount,
    status: "pending",
    date: new Date()
  };
  transactions.push(tx);

  res.json({ message: "Deposit request submitted", tx });
});

// Withdraw
router.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ error: "Missing userId or amount" });
  }

  const tx = {
    id: uuidv4(),
    type: "withdraw",
    userId,
    amount,
    status: "pending",
    date: new Date()
  };
  transactions.push(tx);

  res.json({ message: "Withdrawal request submitted", tx });
});

// Get transactions
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json(transactions.filter((t) => t.userId === userId));
});

export default router;
