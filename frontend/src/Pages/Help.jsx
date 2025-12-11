// frontend/src/pages/Help.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const QUICK_SUGGESTIONS = [
  "How do I reset my password?",
  "How do I post a job or project?",
  "How can I contact a freelancer?",
  "Where can I see my contracts?",
];

const Help = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I'm the TalentLink Help Centre bot.\nYou can ask me anything about using TalentLink — or pick a quick question below to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  const sendMessage = async (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const userMessage = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/helpcentre/chat/",
        { question: trimmed },
        { headers: { "Content-Type": "application/json" } }
      );

      const botAnswer =
        response.data.answer || "Sorry, I could not answer that.";
      const steps = botAnswer.split("\n").filter((s) => s.trim().length > 0);

      for (let step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setMessages((prev) => [...prev, { sender: "bot", text: step }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "⚠️ Sorry, something went wrong while trying to answer. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Smooth auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col h-[80vh] md:h-[85vh] overflow-hidden">
        {/* Top header */}
        <header className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-500 text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">
                TalentLink Help Centre
              </h1>
              <p className="text-xs md:text-sm text-purple-100">
                Ask anything about using TalentLink — I’m here to help.
              </p>
            </div>
          </div>
          <span
            className={`text-xs md:text-sm px-3 py-1 rounded-full ${
              loading
                ? "bg-amber-400 text-amber-900"
                : "bg-emerald-400 text-emerald-900"
            }`}
          >
            {loading ? "Bot is typing..." : "Online"}
          </span>
        </header>

        {/* Main content */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-purple-50/60 to-white overflow-hidden">
            <div
              ref={chatRef}
              className="flex-1 px-4 md:px-6 py-4 overflow-y-auto space-y-3"
            >
              <div className="flex flex-col space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl break-words shadow-sm text-sm md:text-base leading-relaxed ${
                        m.sender === "bot"
                          ? "bg-white text-gray-900 border border-purple-100"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      {m.text
                        .replace(/\*\*/g, "")
                        .split("\n")
                        .map((line, idx) => (
                          <p key={idx} className="mb-1 last:mb-0">
                            {line}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl bg-white text-gray-700 border border-purple-100 shadow-sm flex items-center space-x-2">
                      <span className="inline-flex space-x-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce [animation-delay:100ms]" />
                        <span className="w-2 h-2 bg-purple-200 rounded-full animate-bounce [animation-delay:200ms]" />
                      </span>
                      <span className="text-xs md:text-sm text-gray-600">
                        Typing...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Section */}
            <div className="border-t border-purple-100 bg-white px-4 md:px-6 py-3">
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-xs md:text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-end space-x-2">
                <textarea
                  className="flex-1 max-h-32 min-h-[44px] px-4 py-2 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm md:text-base resize-none shadow-sm transition-all duration-200"
                  placeholder="Describe your issue or question… (Press Enter to send, Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                />
                <button
                  className={`flex items-center justify-center px-4 md:px-5 py-2 md:py-3 rounded-2xl font-semibold text-sm md:text-base shadow-md transition transform hover:scale-105 ${
                    input.trim() && !loading
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed hover:scale-100"
                  }`}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                >
                  <span className="hidden md:inline mr-1">Send</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M4.5 19.5l15-7.5-15-7.5 3 7.5-3 7.5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right-side Info */}
          <aside className="w-full md:w-72 border-t md:border-l border-purple-100 bg-white/70 backdrop-blur-sm px-4 py-4 md:py-5 flex flex-col gap-4 text-sm text-gray-700">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
              <h2 className="font-semibold text-purple-700 mb-1">
                Tips for better answers
              </h2>
              <ul className="list-disc list-inside text-xs md:text-sm space-y-1 text-gray-700">
                <li>Mention if you’re a client or a freelancer.</li>
                <li>Include which page you’re on (e.g. “contracts page”).</li>
                <li>Share any error message you see, if applicable.</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
              <h3 className="font-semibold text-gray-800 mb-1">
                Common topics:
              </h3>
              <ul className="list-disc list-inside text-xs md:text-sm space-y-1">
                <li>Posting projects or jobs</li>
                <li>Sending proposals & contracts</li>
                <li>Workspaces and payments</li>
                <li>Reviews & ratings</li>
              </ul>
            </div>

            <div className="mt-auto text-xs md:text-sm text-gray-500">
              Need human help? Use the{" "}
              <span className="font-semibold text-purple-600">
                Contact Us
              </span>{" "}
              page for detailed support.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Help;
