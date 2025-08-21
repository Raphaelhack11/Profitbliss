// server/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { getDb } from "../db.js";

const router = express.Router();

// setup Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// signup
router.post("/signup", async (req, res) => {
  const { name, email, phone, password, referral } = req.body;
  const db = getDb();

  try {
    if (referral && referral !== "tmdf28dns") {
      return res.status(400).json({ error: "Invalid referral code" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO users (name, email, phone, password, referral) VALUES (?,?,?,?,?)`,
      [name, email, phone, hashed, referral || ""]
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // send verification email
    const verifyLink = `${process.env.BASE_URL}/api/auth/verify/${token}`;
    await transporter.sendMail({
      from: `"Profit Bliss" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your Profit Bliss account",
      html: `<p>Hello ${name},</p>
             <p>Click the link below to verify your account:</p>
             <a href="${verifyLink}">${verifyLink}</a>`
    });

    res.json({ message: "Signup successful, please check your email to verify" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Email already exists or DB error" });
  }
});

// verify email
router.get("/verify/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const db = getDb();
    await db.run(`UPDATE users SET verified = 1 WHERE id = ?`, [decoded.id]);
    res.send("✅ Email verified. You can now log in.");
  } catch {
    res.status(400).send("Invalid or expired verification link");
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });

  if (!user.verified) {
    return res.status(400).json({ error: "Please verify your email first" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance
    }
  });
});

export default router;
