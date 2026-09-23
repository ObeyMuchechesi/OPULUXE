import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/services.js";
import bookingRoutes from "./routes/bookings.js";
import waRoutes from "./routes/wa.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, service: "opuluxe-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/wa", waRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 for unknown API routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

// Start DB connection immediately.
// Mongoose queues commands until the connection is open, so this works
// both for the local server and for serverless cold starts.
connectDB().catch((err) => console.error("MongoDB connection failed:", err.message));

// Export for serverless platforms (Vercel api/index.js)
export default app;

// Local development: listen only when not running on Vercel
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => console.log(`🚀 OPULUXE API running on port ${PORT}`));
}
