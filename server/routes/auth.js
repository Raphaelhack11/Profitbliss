/**
 * server/routes/auth.js
 * - POST /api/auth/signup           { email, password, phone, referral }
 * - GET  /api/auth/verify/:token
 * - POST /api/auth/resend          { email }
 * - POST /api/auth/login           { email, password }
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 *
 * Uses cookies for auth token (httpOnly cookie pb_token)
 */

import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { db } from "../db.js";

const router = express.Router();

// nodemailer with Gmail SMTP - requires EMAIL_USER and EMAIL_PASS
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function signToken(userId) {
  const secret = process.env.JWT_SECRET || "please-set-a-secret";
  return jwt.sign({ uid: userId }, secret, { expiresIn: "7d" });
}

function setAuthCookie(res, token) {
  // in production set secure:true and sameSite accordingly
  res.cookie("pb_token", token, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}

async function sendVerificationEmail(email, token) {
  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
  const link = `${base}/api/auth/verify/${token}`;
  const html = `
    <div>
      <h3>Welcome to Profit Bliss</h3>
      <p>Click to verify your email:</p>
      <a href="${link}">${link}</a>
      <p>If you did not sign up, ignore this message.</p>
    </div>`;
  await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: "Verify your Profit Bliss account", html });
}

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password, phone, referral } = req.body || {};
    if (!email || !password) return res.status(400).send("Email and password required");
    // referral validation: allow blank or exact code tmdf28dns
    if (referral && referral !== "tmdf28dns") return res.status(400).send("Invalid referral code");

    const exists = await db.get("SELECT id FROM users WHERE email = ?", email.toLowerCase());
    if (exists) return res.status(400).send("Email already registered");

    const hash = bcrypt.hashSync(password, 10);
    const result = await db.run("INSERT INTO users (email, password, phone, referral, verified) VALUES (?, ?, ?, ?, 0)",
      email.toLowerCase(), hash, phone || null, referral || null);
    const userId = result.lastID;

    // create verify token
    const token = crypto.randomBytes(20).toString("hex");
    await db.run("INSERT INTO verify_tokens (user_id, token) VALUES (?, ?)", userId, token);

    // send verification email (async)
    try { await sendVerificationEmail(email, token); } catch (e) { console.error("Email send failed", e); }

    return res.json({ ok: true, message: "Signup successful. Check your email for verification link." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// VERIFY
router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const row = await db.get("SELECT * FROM verify_tokens WHERE token = ?", token);
    if (!row) return res.status(400).send("Invalid or expired token");
    await db.run("UPDATE users SET verified = 1 WHERE id = ?", row.user_id);
    await db.run("DELETE FROM verify_tokens WHERE id = ?", row.id);
    return res.send("Email verified! You can now log in.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// RESEND verification
router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).send("Email required");
    const user = await db.get("SELECT id, verified FROM users WHERE email = ?", email.toLowerCase());
    if (!user) return res.status(404).send("User not found");
    if (user.verified) return res.status(400).send("Already verified");

    const token = crypto.randomBytes(20).toString("hex");
    await db.run("INSERT INTO verify_tokens (user_id, token) VALUES (?, ?)", user.id, token);
    try { await sendVerificationEmail(email, token); } catch (e) { console.error("Email send failed", e); }

    return res.json({ ok: true, message: "Verification email resent" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).send("Email and password required");
    const user = await db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase());
    if (!user) return res.status(400).send("Invalid email or password");
    if (!user.verified) return res.status(401).send("Email not verified");
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(400).send("Invalid email or password");

    const token = signToken(user.id);
    setAuthCookie(res, token);

    // return safe user object
    const safe = { id: user.id, email: user.email, phone: user.phone, balance: user.balance, isAdmin: !!user.is_admin };
    return res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// LOGOUT
router.post("/logout", (_req, res) => {
  res.clearCookie("pb_token");
  res.json({ ok: true });
});

// ME
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.pb_token;
    if (!token) return res.status(401).send("Unauthorized");
    const secret = process.env.JWT_SECRET || "please-set-a-secret";
    let data;
    try { data = jwt.verify(token, secret); } catch { return res.status(401).send("Unauthorized"); }
    const user = await db.get("SELECT id, email, phone, balance, is_admin FROM users WHERE id = ?", data.uid);
    if (!user) return res.status(401).send("Unauthorized");
    res.json({ id: user.id, email: user.email, phone: user.phone, balance: user.balance, isAdmin: !!user.is_admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
