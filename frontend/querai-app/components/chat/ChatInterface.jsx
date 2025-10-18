"use client";

import { useEffect, useRef, useState } from "react";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AIMessage from "@/components/chat/AIMessage";
import AILoading from "@/components/chat/AILoading";
import { Database, FileSpreadsheet } from "lucide-react";

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
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full w-full max-w-3xl">

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-32 space-y-4 scroll-pt-32">
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
                <div className="w-full">
                  <AIMessage content={m.content} />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="w-full">
            <AILoading />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-4 border-t">
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            <span className={`inline-block h-2 w-2 rounded-full ${selectedConnection ? 'bg-green-500' : 'bg-neutral-400'}`} />
            {selectedConnection && (["CSV", "Excel"].includes(selectedConnection.source_type)) ? (
              <FileSpreadsheet className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>{selectedConnection ? selectedConnection.name : 'No source selected'}</span>
          </div>
        </div>
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
