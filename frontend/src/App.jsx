import { useState } from "react";
import RepoForm from "./components/RepoForm";
import ChatWindow from "./components/ChatWindow";

const API_URL = "http://localhost:5000/api";

function App() {
  const [session, setSession] = useState({ id: null, repoUrl: null });
  const [isIndexed, setIsIndexed] = useState(false);

  const handleIndexingSuccess = async (indexedRepoUrl) => {
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: indexedRepoUrl }),
      });
      if (!response.ok) throw new Error("Failed to start session");
      const data = await response.json();
      setSession({ id: data.sessionId, repoUrl: indexedRepoUrl });
      setIsIndexed(true);
    } catch (error) {
      console.error("Session start error:", error);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans antialiased">
      <div className="container mx-auto p-4 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-cyan-400 tracking-tight">
            Git-Query
          </h1>
          <p className="text-gray-400 mt-2">
            Have a conversation with any public GitHub repository.
          </p>
        </header>

        <main>
          {!isIndexed ? (
            <RepoForm onSuccess={handleIndexingSuccess} apiUrl={API_URL} />
          ) : (
            <ChatWindow
              sessionId={session.id}
              repoUrl={session.repoUrl}
              apiUrl={API_URL}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
