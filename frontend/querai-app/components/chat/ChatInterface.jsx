"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AIMessage from "@/components/chat/AIMessage";
import AILoading from "@/components/chat/AILoading";
import { Database, FileSpreadsheet, Loader2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ChatInterface() {
  const { currentChatId, currentMessages, addMessage, setMessages, setChatId, currentDataSourceId } = useChatStore();
  const { selectedConnection } = useConnectionStore();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [firstUserText, setFirstUserText] = useState("");
  const [titled, setTitled] = useState(false);
  const creatingRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(50);

  const currentDataSourceName = useMemo(() => selectedConnection?.name || "", [selectedConnection?.name]);
  const visibleMessages = useMemo(() => {
    const len = currentMessages.length;
    const start = Math.max(0, len - visibleCount);
    return currentMessages.slice(start);
  }, [currentMessages, visibleCount]);

  function trackAnalytics(name, props = {}) {
    try { window.dispatchEvent(new CustomEvent('analytics', { detail: { name, props } })); } catch {}
  }

  // Load persisted chat on mount
  useEffect(() => {
    (async () => {
      try {
        const savedId = localStorage.getItem('currentChatId');
        if (!savedId) return;
        const supabase = createClient();
        const { data, error } = await supabase
          .from('chats')
          .select('id,messages')
          .eq('id', savedId)
          .single();
        if (error || !data) {
          toast.error('This chat has expired or was deleted.');
          localStorage.removeItem('currentChatId');
          setChatId(null);
          setMessages([]);
          return;
        }
        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        const normalized = msgs.map((m) => {
          if (m?.role === 'assistant') {
            const explanation = typeof m.content === 'string' ? m.content : (m.content?.explanation || '');
            const sql = m.sql || m.content?.sql || m.sql_query || '';
            const rows = Array.isArray(m.results) ? m.results : (Array.isArray(m.content?.data) ? m.content.data : []);
            return { role: 'assistant', content: { explanation, sql, data: rows } };
          }
          if (m?.role === 'user') {
            return { role: 'user', content: m.content };
          }
          return m;
        });
        setMessages(normalized);
        setChatId(savedId);
      } catch (e) {
        toast.error('Could not load chat.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset local title flags when switching chats
  useEffect(() => {
    setFirstUserText("");
    setTitled(false);
  }, [currentChatId]);

  // Auto-create a new chat when a data source is selected and no chat exists
  useEffect(() => {
    async function ensureChat() {
      if (creatingRef.current) return;
      if (currentChatId) return;
      const dsId = currentDataSourceId || selectedConnection?.id;
      if (!dsId) return;
      try {
        creatingRef.current = true;
        const res = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data_source_id: dsId }),
        });
        const data = await res.json();
        if (res.ok && data?.chat_id) {
          setMessages([]);
          setChatId(data.chat_id);
          try { window.dispatchEvent(new CustomEvent('chat:refresh-list')); } catch {}
          trackAnalytics('chat_created', { chat_id: data.chat_id, source_id: dsId });
        } else {
          toast.error(data?.error || 'Failed to auto-start a new chat.');
        }
      } catch (e) {
        toast.error('Failed to auto-start a new chat.');
      } finally {
        creatingRef.current = false;
      }
    }
    ensureChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId, currentDataSourceId, selectedConnection?.id]);

  async function onSubmit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    if (!selectedConnection || !currentChatId) {
      toast.error("Please start a chat with a data source selected.");
      return;
    }

    if (currentMessages.length === 0) {
      setFirstUserText(q);
    }
    addMessage({ role: "user", content: q });
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: currentChatId, message: q }),
      });
      const data = await res.json();
      if (res.ok) {
        addMessage({ role: "ai", content: { explanation: data?.explanation, sql: data?.sql, data: data?.results } });
        // Auto-title after first exchange
        try {
          if (!titled && firstUserText && currentMessages.length === 1) {
            const words = firstUserText.trim().split(/\s+/).slice(0, 8);
            const title = words.join(' ');
            const supabase = createClient();
            await supabase.from('chats').update({ title }).eq('id', currentChatId);
            setTitled(true);
            // notify chat list to refresh
            try { window.dispatchEvent(new CustomEvent('chat:refresh-list')); } catch {}
            trackAnalytics('chat_titled', { chat_id: currentChatId, title });
          }
        } catch {}
      } else {
        addMessage({ role: "ai", content: { explanation: data?.error || "Request failed.", detail: data?.detail } });
        toast.error(data?.error || 'Backend is offline, please retry.');
      }
    } catch (err) {
      addMessage({ role: "ai", content: { explanation: "Request failed. Please try again.", detail: String(err) } });
      toast.error('Backend is offline, please retry.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, loading]);

  return (
    <div className="flex flex-col h-full w-full max-w-3xl">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-32 space-y-4 scroll-pt-32">
        {currentMessages.length > visibleMessages.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 50)}
              className="rounded border px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              Load older messages
            </button>
          </div>
        )}
        {visibleMessages.length === 0 ? (
          <p className="text-sm text-neutral-500">Start a new chat to begin.</p>
        ) : (
          visibleMessages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              {m.role === "user" ? (
                <div className="inline-block max-w-[80%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white dark:bg-blue-700">
                  {m.content}
                </div>
              ) : (
                <div className="w-full ai-fade">
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
        <div className="text-xs text-muted-foreground px-2 pb-1">
          Connected to: <span className="font-medium">{currentDataSourceName || 'None'}</span>
        </div>
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
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={selectedConnection ? "Type a message..." : "Select a data source to chat"}
            disabled={!selectedConnection || loading || !currentChatId}
            className="h-12 w-full resize-none rounded-md border px-4 py-2 text-base md:text-base disabled:opacity-60 outline-none bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/10 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:border-sky-300/60"
          />
          <Button type="submit" size="lg" disabled={!selectedConnection || loading || !currentChatId} className="h-12 w-28 justify-center px-6 text-base">
            {loading ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending</span>) : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Local fade-in animation for assistant messages
// Scoped to this component via styled-jsx
// Ensures no global CSS changes required
/* eslint-disable @next/next/no-css-tags */
<style jsx>{`
  @keyframes aiFade {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ai-fade { animation: aiFade .28s ease-out both; }
`}</style>
