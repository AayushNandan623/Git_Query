import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  content: { type: String, required: true },
});

const ChatHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    repoUrl: { type: String, required: true },
    history: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("ChatHistory", ChatHistorySchema);
