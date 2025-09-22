import express from "express";
import { startSession, askQuestion } from "../controllers/chatController.js";

const router = express.Router();

router.post("/start", startSession);
router.post("/ask", askQuestion);

export default router;
