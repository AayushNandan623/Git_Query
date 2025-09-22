import axios from "axios";

const RELEVANT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".md",
  ".json",
  ".html",
  ".css",
  ".scss",
  "Dockerfile",
  ".yml",
  ".yaml",
  ".sh",
  ".env.example",
  ".xml",
  ".java",
  ".go",
  ".php",
]);

const isRelevantFile = (filePath) => {
  if (
    filePath.includes("node_modules") ||
    filePath.includes("dist") ||
    filePath.includes("build")
  ) {
    return false;
  }
  const parts = filePath.split("/");
  const lastPart = parts[parts.length - 1];
  // Handle files with extensions and files without (like 'Dockerfile')
  const extension = lastPart.includes(".")
    ? `.${lastPart.split(".").pop()}`
    : lastPart;
  return RELEVANT_EXTENSIONS.has(extension);
};

export const getRepoContent = async (repoUrl) => {
  const urlParts = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlParts)
    throw new Error(
      "Invalid GitHub URL format. Use https://github.com/owner/repo"
    );
  const [, owner, repo] = urlParts;

  // 1. Fetch file tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const treeResponse = await axios.get(treeUrl);

  // 2. Filter for relevant files and limit the count
  const filesToFetch = treeResponse.data.tree
    .filter((file) => file.type === "blob" && isRelevantFile(file.path))
    .slice(0, 100); // Limit to 100 files to manage performance

  if (filesToFetch.length === 0) {
    throw new Error(
      "No relevant code or text files were found in this repository."
    );
  }

  // 3. Fetch content for each file concurrently
  const contentPromises = filesToFetch.map(async (file) => {
    const contentUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`;
    const contentResponse = await axios.get(contentUrl);
    return {
      pageContent: contentResponse.data,
      metadata: { source: file.path },
    };
  });

  return Promise.all(contentPromises);
};
