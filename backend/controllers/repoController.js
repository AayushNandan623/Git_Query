import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import Document from "../models/documentModel.js";
import { createEmbeddings } from "../services/geminiService.js";
import { getRepoContent } from "../services/githubService.js";

export const indexRepository = async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res
      .status(400)
      .json({ message: "GitHub repository URL is required." });
  }

  try {
    // 1. Fetch and filter repo content
    const docs = await getRepoContent(repoUrl);

    // **FIX STARTS HERE: Filter out documents that are not strings**
    const validDocs = docs.filter((doc) => typeof doc.pageContent === "string");

    if (validDocs.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid text documents were found to index." });
    }
    // **FIX ENDS HERE**

    // 2. Split documents into chunks using the filtered list
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
    });
    // Use the validated 'validDocs' array here
    const chunks = await splitter.splitDocuments(validDocs);

    // 3. Create embeddings for each chunk
    const contents = chunks.map((chunk) => chunk.pageContent);
    const embeddings = await createEmbeddings(contents);

    // 4. Prepare documents for MongoDB
    const documentsToStore = chunks.map((chunk, index) => ({
      repoUrl,
      filePath: chunk.metadata.source,
      content: chunk.pageContent,
      embedding: embeddings[index],
    }));

    // 5. Clear old documents and insert new ones
    await Document.deleteMany({ repoUrl });
    await Document.insertMany(documentsToStore);

    res.status(201).json({
      message: `Repository indexed successfully. ${chunks.length} chunks created from ${validDocs.length} valid files.`,
    });
  } catch (error) {
    console.error("Indexing error:", error.message);
    res
      .status(500)
      .json({ message: `Error indexing repository: ${error.message}` });
  }
};
