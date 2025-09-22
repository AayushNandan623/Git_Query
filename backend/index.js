import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import repoRoutes from "./routes/repoRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Routes
app.use("/api/repo", repoRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
