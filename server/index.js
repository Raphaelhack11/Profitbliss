const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// DB
const db = new sqlite3.Database("./profitbliss.db", (err) => {
  if (err) console.error(err.message);
  else console.log("Connected to SQLite DB.");
});

// Simple route
app.get("/", (req, res) => {
  res.json({ msg: "Profit Bliss Backend Running ✅" });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
