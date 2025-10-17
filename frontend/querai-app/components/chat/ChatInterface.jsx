"use client";

import { useEffect, useRef, useState } from "react";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AIMessage from "@/components/chat/AIMessage";

export default function ChatInterface() {
  const { selectedConnection } = useConnectionStore();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedConnection) return;
    const q = question.trim();
    if (!q) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, connection_id: selectedConnection.id }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", content: data }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: { explanation: "Request failed. Please try again.", detail: String(err) } },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full max-w-3xl">
      <div className="flex-shrink-0 p-4 border-b">
        {selectedConnection ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            <span className="font-medium">Active Source:</span>
            <span>{selectedConnection.name}</span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">Type a question below to begin.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              {m.role === "user" ? (
                <div className="inline-block max-w-[80%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white dark:bg-blue-700">
                  {m.content}
                </div>
              ) : (
                <div className="inline-block max-w-[100%] rounded-lg bg-white p-3 text-sm shadow dark:bg-neutral-900">
                  <AIMessage content={m.content} />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 border-t p-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={selectedConnection ? "Ask a question about your data..." : "Select a data source to chat"}
            disabled={!selectedConnection || loading}
          />
          <Button type="submit" disabled={!selectedConnection || loading} className="w-24 justify-center">
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
