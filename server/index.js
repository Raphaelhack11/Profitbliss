import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import plansRoutes from "./plans.js";
import transactionsRoutes from "./transactions.js";
import messagesRoutes from "./messages.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/", (req, res) => {
  res.send("🚀 ProfitBliss API running...");
});

// Routes
app.use("/api/plans", plansRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/messages", messagesRoutes);

// Catch-all for invalid routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
