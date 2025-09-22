import { useState, useRef, useEffect } from "react";
import axios from "axios";

const ThinkingIndicator = () => (
  <div className="flex justify-start">
    <div className="my-2 p-3 rounded-lg bg-gray-700 flex items-center space-x-2">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
      <span className="text-gray-300 text-sm">Thinking...</span>
    </div>
  </div>
);

const ChatWindow = ({ sessionId, repoUrl, apiUrl }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/chat/ask`, {
        sessionId,
        question: input,
      });
      const modelMessage = { role: "model", content: response.data.answer };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage = {
        role: "model",
        content: "Sorry, an error occurred. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-2xl flex flex-col h-[75vh]">
      <div className="text-sm text-center mb-2 text-gray-400">
        Chatting with:{" "}
        <span className="font-medium text-cyan-400">{repoUrl}</span>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xl ${
                msg.role === "user" ? "bg-cyan-800" : "bg-gray-700"
              }`}
            >
              <p className="whitespace-pre-wrap text-white">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="mt-4 flex space-x-2 border-t border-gray-700 pt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow bg-gray-900 text-white border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          placeholder="Ask a question about the code..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
