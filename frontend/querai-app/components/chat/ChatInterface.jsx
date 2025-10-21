"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AIMessage from "@/components/chat/AIMessage";
import AILoading from "@/components/chat/AILoading";
import { Database, FileSpreadsheet, Loader2, Forward } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { useConnectionStore } from "@/lib/stores/connectionStore";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FadeIn } from "@/components/brand/Motion";

export default function ChatInterface() {
  const { currentChatId, currentMessages, addMessage, setMessages, setChatId, currentDataSourceId, setDataSource } = useChatStore();
  const { selectedConnection } = useConnectionStore();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
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
          .select('id,messages,data_source_id')
          .eq('id', savedId)
          .single();
        if (error || !data) {
          toast.error('This chat has expired or was deleted.');
          localStorage.removeItem('currentChatId');
          setChatId(null);
          setMessages([]);
          setDataSource(null);
          return;
        }
        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        const normalized = msgs.map((m) => {
          if (m?.role === 'assistant') {
            const explanation = typeof m.content === 'string' ? m.content : (m.content?.explanation || '');
            const sql = m.sql || m.content?.sql || m.sql_query || '';
            const rows = Array.isArray(m.results) ? m.results : (Array.isArray(m.content?.data) ? m.content.data : []);
            const response_type = m.response_type || m.content?.response_type || (sql ? 'sql' : 'meta');
            return { role: 'assistant', content: { explanation, sql, data: rows, response_type } };
          }
          if (m?.role === 'user') {
            return { role: 'user', content: m.content };
          }
          return m;
        });
        setMessages(normalized);
        setChatId(savedId);
        setDataSource(data?.data_source_id || null);
      } catch (e) {
        toast.error('Could not load chat.');
        setDataSource(null);
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
        const persistedId = localStorage.getItem('currentChatId');
        if (persistedId) return;
      } catch {}
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
          setDataSource(dsId);
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
        addMessage({ role: "ai", content: { explanation: data?.explanation, sql: data?.sql, data: data?.results, response_type: data?.response_type } });
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

  // Note: We keep the input visually one-line high; no auto-resize.

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
            <Button type="button" size="sm" variant="outline" onClick={() => setVisibleCount((c) => c + 50)}>
              Load older messages
            </Button>
          </div>
        )}
        {visibleMessages.length === 0 ? (
          <p className="text-sm text-neutral-500">Start a new chat to begin.</p>
        ) : (
          visibleMessages.map((m, i) => (
            <FadeIn key={i}>
              <div className={m.role === "user" ? "text-right" : "text-left"}>
                {m.role === "user" ? (
                  <div className="inline-block max-w-[80%] rounded-xl border border-[var(--qr-border)] bg-[var(--qr-surface)] px-4 py-2 text-sm text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] backdrop-blur-md">
                    {m.content}
                  </div>
                ) : (
                  <div className="w-full">
                    <AIMessage content={m.content} />
                  </div>
                )}
              </div>
            </FadeIn>
          ))
        )}
        {loading && (
          <div className="w-full">
            <AILoading />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-4 border-t border-[var(--qr-border)]">
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] px-3 py-1 text-sm text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] backdrop-blur">
            <span className={`inline-block h-2 w-2 rounded-full ${selectedConnection ? 'bg-green-500' : 'bg-neutral-400'}`} />
            {(() => { const st = String(selectedConnection?.source_type || '').toLowerCase(); return (st === 'csv' || st === 'excel'); })() ? (
              <FileSpreadsheet className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>{selectedConnection ? selectedConnection.name : 'No source selected'}</span>
          </div>
        </div>
        <form onSubmit={onSubmit}>
          <div className="flex items-end gap-2 rounded-xl border border-[var(--qr-border)] bg-[var(--qr-surface)] px-2 py-1.5 shadow-[var(--qr-shadow-sm)] backdrop-blur-md">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => { setQuestion(e.target.value); }}
              onPaste={(e) => {
                // Prevent accidental newlines on paste; allow only Shift+Enter for manual newlines
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text') || '';
                const sanitized = text.replace(/\r?\n/g, ' ');
                const el = textareaRef.current;
                if (!el) return;
                const start = el.selectionStart ?? question.length;
                const end = el.selectionEnd ?? question.length;
                const next = question.slice(0, start) + sanitized + question.slice(end);
                setQuestion(next);
                requestAnimationFrame(() => {
                  try { el.selectionStart = el.selectionEnd = start + sanitized.length; } catch {}
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder={selectedConnection ? "Type a message..." : "Select a data source to chat"}
              disabled={!selectedConnection || loading || !currentChatId}
              maxLength={750}
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-base md:text-base disabled:opacity-60 outline-none text-[var(--qr-text)] placeholder:text-[color:var(--qr-text)/60] h-10"
              style={{ height: 40 }}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon-lg"
              aria-label="Send"
              disabled={!selectedConnection || loading || !currentChatId}
              className="shrink-0"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Forward className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Motion handled by FadeIn component above
