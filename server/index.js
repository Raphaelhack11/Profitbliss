/**
 * server/index.js
 * Entrypoint for Profit Bliss backend (simple Express + SQLite + email verification)
 *
 * Env vars required:
 *  - PORT (optional, default 8080)
 *  - JWT_SECRET (a long random string)
 *  - EMAIL_USER (Gmail address for sending verification emails)
 *  - EMAIL_PASS (Gmail App Password)
 *  - BASE_URL (public URL of backend, e.g. https://profitbliss-backend.onrender.com)
 *
 * Note: on Render set EMAIL_USER and EMAIL_PASS (app password). Use HTTPS in production.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// initialize sqlite DB (creates tables if missing)
await initDb();

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// mount auth routes at /api/auth
app.use("/api/auth", authRoutes);

// simple index route
app.get("/", (_req, res) => res.send("Profit Bliss backend running"));

// start
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Make sure env vars JWT_SECRET, EMAIL_USER and EMAIL_PASS are set.");
});
