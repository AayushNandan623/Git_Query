import ChatHistory from "../models/chatHistoryModel.js";
import {
  semanticSearch,
  askGeminiWithMemory,
} from "../services/geminiService.js";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const startSession = async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ message: "repoUrl is required." });
  }
  try {
    const sessionId = uuidv4();
    const newChat = new ChatHistory({ sessionId, repoUrl, history: [] });
    await newChat.save();
    res.status(201).json({ sessionId });
  } catch (error) {
    res.status(500).json({ message: "Failed to start a new session." });
  }
};

export const askQuestion = async (req, res) => {
  const { question, sessionId } = req.body;
  if (!question || !sessionId) {
    return res
      .status(400)
      .json({ message: "Question and sessionId are required." });
  }

  try {
    const chat = await ChatHistory.findOne({ sessionId });
    if (!chat) return res.status(404).json({ message: "Session not found." });

    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    // **FIX:** Wrap the question in the required object structure
    const queryEmbeddingResult = await embeddingModel.embedContent({
      content: { parts: [{ text: question }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    });
    const queryVector = queryEmbeddingResult.embedding.values;

    const searchResults = await semanticSearch(queryVector, chat.repoUrl);

    const context = searchResults
      .map((r) => `File Path: ${r.filePath}\n\nContent:\n${r.content}`)
      .join("\n\n---\n\n");

    const answer = await askGeminiWithMemory(context, question, chat.history);

    chat.history.push({ role: "user", content: question });
    chat.history.push({ role: "model", content: answer });
    await chat.save();

    res.status(200).json({ answer, sources: searchResults });
  } catch (error) {
    console.error("Error asking question:", error);
    res.status(500).json({ message: "Error processing your question." });
  }
};
