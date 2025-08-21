import express from "express";

const router = express.Router();

// Example plans (could also be pulled from DB)
const plans = [
  { id: 1, name: "Starter Plan", min: 100, max: 999, roi: "5% weekly" },
  { id: 2, name: "Pro Plan", min: 1000, max: 9999, roi: "7% weekly" },
  { id: 3, name: "Elite Plan", min: 10000, max: 100000, roi: "10% weekly" }
];

// Get all plans
router.get("/", (req, res) => {
  res.json(plans);
});

// Select a plan (store in DB in real use)
router.post("/select", (req, res) => {
  const { userId, planId } = req.body;
  if (!userId || !planId) {
    return res.status(400).json({ error: "Missing userId or planId" });
  }
  res.json({ message: `User ${userId} selected plan ${planId}` });
});

export default router;
