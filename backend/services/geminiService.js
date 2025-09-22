import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import Document from "../models/documentModel.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Creates vector embeddings for an array of text chunks using the latest Gemini model.
 * @param {string[]} texts - An array of strings to embed.
 * @returns {Promise<number[][]>} A promise that resolves to an array of embeddings.
 */
export const createEmbeddings = async (texts) => {
  const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  // Filter out any non-string or empty string values to prevent API errors
  const validTexts = texts.filter(
    (t) => typeof t === "string" && t.trim() !== ""
  );

  if (validTexts.length === 0) {
    return []; // Return empty if no valid texts to process
  }

  const result = await embeddingModel.batchEmbedContents({
    requests: validTexts.map((text) => ({
      // **FIX:** Wrap the text in the required object structure
      content: { parts: [{ text }] },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })),
  });

  return result.embeddings.map((e) => e.values);
};

/**
 * Performs semantic search against the MongoDB vector store, filtered by repoUrl.
 * @param {number[]} queryVector - The vector representation of the search query.
 * @param {string} repoUrl - The URL of the repository to search within.
 * @returns {Promise<any[]>} A promise that resolves to the search results.
 */
export const semanticSearch = async (queryVector, repoUrl) => {
  return Document.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        queryVector,
        path: "embedding",
        filter: { repoUrl: { $eq: repoUrl } },
        numCandidates: 150,
        limit: 8,
      },
    },
    {
      $project: {
        _id: 0,
        filePath: 1,
        content: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
};

/**
 * Asks a question to the Gemini model, including context and chat history for memory.
 * @param {string} context - The context retrieved from the vector search.
 * @param {string} question - The user's original question.
 * @param {Array<object>} chatHistory - The previous messages in the conversation.
 * @returns {Promise<string>} A promise that resolves to the generated answer.
 */
export const askGeminiWithMemory = async (context, question, chatHistory) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const formattedHistory = chatHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history: formattedHistory });

  const prompt = `You are an expert software developer AI assistant named Git-Query. Your task is to be a helpful, in-depth conversational partner.

Follow this logic:
1.  **Analyze the User's Question:** First, understand if the user is asking a question directly about the code in the provided "CONTEXT FROM REPOSITORY" or if they are asking a more general, conceptual question (e.g., "teach me about redis").

2.  **Prioritize Repository Context:** If the question can be answered using the provided context, you MUST base your answer on it. When you do this, begin your response with "Based on the repository files...". Provide detailed explanations and elaborate on the code's purpose and functionality.

3.  **Use General Knowledge as a Fallback:** If the context is insufficient OR the user asks a general knowledge question, you are then permitted to use your own internal knowledge to provide a comprehensive answer. When you do this, you MUST begin your response with "From my general knowledge base...".

4.  **Be Conversational:** Do not simply state "I could not find the answer." Instead, use the logic above to provide the most helpful response possible.

---
CONTEXT FROM REPOSITORY:
${context || "No specific context was found for this query."}
---

User's Question: ${question}

ANSWER:`;

  const result = await chat.sendMessage(prompt);
  return result.response.text();
};
