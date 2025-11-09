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
  ".dart",
  ".lua",
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
  const extension = lastPart.includes(".")
    ? `.${lastPart.split(".").pop()}`
    : lastPart;

  return RELEVANT_EXTENSIONS.has(extension);
};

export const getRepoContent = async (repoUrl) => {
  console.log("Fetching repo:", repoUrl);

  const urlParts = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlParts)
    throw new Error(
      "Invalid GitHub URL format. Use https://github.com/owner/repo"
    );

  const [, owner, repo] = urlParts;

  try {
    // Get repo metadata to find default branch name
    const repoMetaUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoMetaResponse = await axios.get(repoMetaUrl);
    const defaultBranch = repoMetaResponse.data.default_branch;

    if (!defaultBranch)
      throw new Error("Unable to detect default branch for this repository.");

    console.log(`Detected default branch: ${defaultBranch}`);

    // Get commit tree SHA for that branch
    const branchInfoUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${defaultBranch}`;
    const branchInfoResponse = await axios.get(branchInfoUrl);
    const treeSha = branchInfoResponse.data?.commit?.commit?.tree?.sha;

    if (!treeSha)
      throw new Error("Unable to retrieve tree SHA for default branch.");

    // Fetch recursive tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
    const treeResponse = await axios.get(treeUrl);

    if (!treeResponse.data?.tree)
      throw new Error("Invalid response from GitHub API.");

    // Filter relevant files
    const filesToFetch = treeResponse.data.tree
      .filter((file) => file.type === "blob" && isRelevantFile(file.path))
      .slice(0, 100);

    if (filesToFetch.length === 0)
      throw new Error(
        "No relevant code or text files found in this repository."
      );

    // Fetch file contents concurrently
    const contentPromises = filesToFetch.map(async (file) => {
      const contentUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`;
      const contentResponse = await axios.get(contentUrl);
      return {
        pageContent: contentResponse.data,
        metadata: { source: file.path },
      };
    });

    return Promise.all(contentPromises);
  } catch (error) {
    console.error("Error fetching repo content:", error.message);
    throw new Error(
      `Failed to fetch repository content: ${error.response?.status || ""} ${
        error.message
      }`
    );
  }
};
