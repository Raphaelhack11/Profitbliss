// server/routes/plans.js
import express from "express";
import { getDb } from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// middleware to check auth
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

// create/join a plan
router.post("/create", auth, async (req, res) => {
  const { plan_name, stake, daily_roi, duration_days } = req.body;
  const db = getDb();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + duration_days);

  try {
    await db.run(
      `INSERT INTO plans (user_id, plan_name, stake, daily_roi, duration_days, start_date, end_date) 
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.id, plan_name, stake, daily_roi, duration_days, startDate.toISOString(), endDate.toISOString()]
    );
    res.json({ message: "Plan created successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create plan" });
  }
});

// list my plans
router.get("/my", auth, async (req, res) => {
  const db = getDb();
  const plans = await db.all(`SELECT * FROM plans WHERE user_id = ?`, [req.user.id]);
  res.json(plans);
});

export default router;
