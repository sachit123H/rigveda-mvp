"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hari Om! I am the DLIIH Scholar AI. I can assist you in exploring the Rigveda Samhita, translating Sanskrit vocabulary, explaining Sāyaṇācārya's commentaries, or understanding Vedic grammar. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Forgive me, I encountered an issue connecting to the translation engine. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-stone-900 border border-stone-850 w-[340px] md:w-[400px] h-[480px] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Chat Header */}
          <div className="bg-stone-950 text-white px-5 py-4 flex justify-between items-center border-b border-stone-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                DLIIH Assistant
              </span>
              <h3 className="font-serif font-bold text-stone-100 tracking-wide text-sm">
                Vedic Scholar AI
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white text-xl leading-none p-1 transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-5 overflow-y-auto bg-stone-950/60 space-y-4 text-xs md:text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-600 text-stone-50 rounded-tr-none shadow-md"
                      : "bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-900 border border-stone-800 text-stone-400 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-stone-950 border-t border-stone-900 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about Agni, Gayatri, grammar..."
              className="flex-grow px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs md:text-sm text-stone-200 placeholder-stone-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all hover:shadow-lg flex items-center justify-center cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-stone-900 border border-stone-800 text-amber-500 p-4 rounded-full shadow-2xl hover:bg-stone-950 hover:scale-105 transition-all duration-200 flex items-center justify-center float-right active-pulse cursor-pointer"
      >
        {isOpen ? (
          <span className="text-xl leading-none px-1">↓</span>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <svg
              className="w-5 h-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-serif font-bold uppercase tracking-wider hidden md:inline">
              Scholar AI
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
