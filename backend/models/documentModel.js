import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    repoUrl: {
      type: String,
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", DocumentSchema);
