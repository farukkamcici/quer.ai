"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ChatList({ isCollapsed = false }) {
  const [chats, setChats] = useState([]);
  const { currentChatId, setChatId, setMessages } = useChatStore();
  const debounceRef = useRef(null);
  const selectTimerRef = useRef(null);
  useEffect(() => {
    async function fetchChats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('chats')
        .select('id,title,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setChats(data || []);
    }
    fetchChats();
    function onRefresh() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchChats, 150);
    }
    window.addEventListener('chat:refresh-list', onRefresh);
    return () => window.removeEventListener('chat:refresh-list', onRefresh);
  }, []);

  if (!chats.length) {
    if (isCollapsed) {
      return (
        <div className="flex h-full items-center justify-center">
          <div
            title="No chats yet"
            className="w-12 h-12 rounded-xl border border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/10 backdrop-blur-md flex items-center justify-center"
          >
            <MessageSquare className="h-5 w-5 text-neutral-600 dark:text-neutral-300 opacity-70" />
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-neutral-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur p-4 text-sm text-neutral-600 dark:text-neutral-300">
        No chats yet.
      </div>
    );
  }

  async function selectChatNow(id) {
    const supabase = createClient();
    // Load messages for the selected chat into store
    const { data } = await supabase
      .from('chats')
      .select('messages')
      .eq('id', id)
      .single();
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
    setChatId(id);
  }
  function selectChat(id) {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => selectChatNow(id), 120);
  }

  if (isCollapsed) {
    return (
      <ul className="space-y-2 flex flex-col items-center">
        {chats.map((c) => {
          const active = currentChatId === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                title={c.title || 'Untitled Chat'}
                onClick={() => selectChat(c.id)}
                className={`w-10 h-10 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  active
                    ? 'border-[var(--qr-primary)] bg-[color:var(--qr-primary)]/10 dark:bg-[color:var(--qr-primary)]/20'
                    : 'border-[var(--qr-border)] hover:bg-[color:var(--qr-hover)]'
                }`}
              >
                <MessageSquare className={`h-4 w-4 ${active ? 'text-[color:var(--qr-primary)] dark:text-[color:var(--qr-primary)]' : 'text-[color:var(--qr-subtle)]'}`} />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  function expiresIn(createdAt) {
    if (!createdAt) return '';
    const created = new Date(createdAt).getTime();
    const ttlMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = created + ttlMs - now;
    if (remaining <= 0) return 'expired';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `expires in ${hours}h ${minutes}m`;
  }

  return (
    <ul className="space-y-2">
      {chats.map((c) => {
        const active = currentChatId === c.id;
        return (
          <li key={c.id}>
            <div className={`flex items-center justify-between rounded border p-2 text-sm ${
              active
                ? 'border-[var(--qr-primary)] bg-[color:var(--qr-primary)]/8 dark:bg-[color:var(--qr-primary)]/15'
                : 'border-[var(--qr-border)] hover:bg-[color:var(--qr-hover)]'
            }`}>
              <button
                type="button"
                onClick={() => selectChat(c.id)}
                className="flex-1 text-left"
              >
                <div className="flex flex-col">
                  <span className="truncate">{c.title || 'Untitled Chat'}</span>
                  <span className="text-[11px] text-[color:var(--qr-subtle)]">{expiresIn(c.created_at)}</span>
                </div>
              </button>
              <DeleteChatButton id={c.id} afterDelete={() => setChats((prev) => prev.filter((x) => x.id !== c.id))} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DeleteChatButton({ id, afterDelete }) {
  const { currentChatId, resetChat, setChatId } = useChatStore();
  const [open, setOpen] = useState(false);
  async function confirmDelete() {
    const supabase = createClient();
    const { error } = await supabase.from('chats').delete().eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Delete failed', error);
      return;
    }
    if (currentChatId === id) {
      resetChat();
      setChatId(null);
      try { localStorage.removeItem('currentChatId'); } catch {}
    }
    afterDelete?.();
    try { window.dispatchEvent(new CustomEvent('chat:refresh-list')); } catch {}
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="ml-2 rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          title="Delete Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove chat</DialogTitle>
          <DialogDescription>This will permanently delete this chat and its messages. This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
