import express from "express";
import { indexRepository } from "../controllers/repoController.js";

const router = express.Router();

router.post("/index-repo", indexRepository);

export default router;
