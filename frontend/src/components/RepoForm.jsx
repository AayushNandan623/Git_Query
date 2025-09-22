import { useState } from "react";
import axios from "axios";

const RepoForm = ({ onSuccess, apiUrl }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Step 1/2: Fetching repository contents...");

    try {
      const response = await axios.post(`${apiUrl}/repo/index-repo`, {
        repoUrl,
      });
      setStatusMessage(
        `Step 2/2: ${response.data.message}. Starting session...`
      );
      onSuccess(repoUrl);
    } catch (error) {
      const message = error.response
        ? error.response.data.message
        : error.message;
      setStatusMessage(`Error: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="repoUrl"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Public GitHub Repository URL
        </label>
        <div className="flex flex-col sm:flex-row sm:space-x-2">
          <input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-grow w-full bg-gray-900 text-white border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            placeholder="https://github.com/langchain-ai/langchainjs"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            className="mt-2 sm:mt-0 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300"
            disabled={isLoading || !repoUrl}
          >
            Index Repo
          </button>
        </div>
      </form>
      {isLoading && (
        <div className="text-center mt-4 text-cyan-400 font-medium animate-pulse">
          {statusMessage}
        </div>
      )}
      {!isLoading && statusMessage.startsWith("Error") && (
        <div className="text-center mt-4 text-red-400 font-medium">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default RepoForm;
