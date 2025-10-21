"use client";

import { useEffect, useState } from "react";
import NewChatButton from "@/components/chat/NewChatButton";
import ChatList from "@/components/chat/ChatList";
import { GripVertical } from "lucide-react";
import { Surface } from "@/components/brand/Surface";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ChatSidebar() {
  // Start expanded to match SSR; hydrate to saved value after mount
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar:chats:collapsed') === '1';
      setIsCollapsed(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar:chats:collapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  return (
    <aside
      className={`relative shrink-0 transition-all duration-200 h-full overflow-visible flex flex-col py-4 ${
        isCollapsed ? 'w-20' : 'w-80'
      }`}
    >
      <Surface variant="glass" className={`relative ${isCollapsed ? 'mx-2' : 'mx-3'} flex h-full flex-col rounded-3xl overflow-hidden`}>

        {/* Header */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'px-2 py-3' : 'px-4 py-4'} border-b border-[var(--qr-border)]`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <h2 className="text-xs font-semibold tracking-wide text-[var(--qr-text)]/70">Chats</h2>
            )}
            <DeleteAllChatsButton compact={isCollapsed} />
          </div>
        </div>

        {/* Content */}
        <div className={`relative flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <ChatList isCollapsed={isCollapsed} />
        </div>

        {/* Footer (New Chat) */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-[var(--qr-border)]`}>
          {isCollapsed ? (
            <NewChatButton compact />
          ) : (
            <NewChatButton />
          )}
        </div>
      </Surface>

      {/* Edge-centered toggle button (drag-like pill slightly outside) */}
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 inline-flex h-16 w-8 items-center justify-center rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] hover:bg-[color:var(--qr-hover)] cursor-pointer backdrop-blur-md"
        title={isCollapsed ? "Expand" : "Collapse"}
        aria-pressed={isCollapsed}
      >
        <GripVertical className="h-5 w-5 opacity-70" />
      </button>
    </aside>
  );
}

function DeleteAllChatsButton({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const { resetChat, setChatId, setMessages } = useChatStore();

  // Fetch chat count to enable/disable the button
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) setChatCount(0); return; }
      const { count } = await supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (mounted) setChatCount(count || 0);
    }
    fetchCount();
    function onRefresh() { fetchCount(); }
    window.addEventListener('chat:refresh-list', onRefresh);
    return () => { mounted = false; window.removeEventListener('chat:refresh-list', onRefresh); };
  }, []);

  async function confirmDeleteAll() {
    try {
      setDeleting(true);
      const res = await fetch('/api/chat/delete-all', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('Delete all failed', data);
        toast.error('Failed to delete all chats');
      } else {
        toast.success('All chats deleted');
      }
      // Reset local chat state regardless; server will enforce auth/rls
      resetChat();
      setChatId(null);
      setMessages([]);
      try { localStorage.removeItem('currentChatId'); } catch {}
      try { window.dispatchEvent(new CustomEvent('chat:refresh-list')); } catch {}
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const button = (
    <button
      type="button"
      title="Delete all chats"
      disabled={deleting || chatCount === 0}
      className={`${compact ? 'p-1' : 'px-2 py-1'} rounded-md border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] hover:bg-[color:var(--qr-hover)] shadow-[var(--qr-shadow-sm)] ${deleting || chatCount === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Trash2 className={`${compact ? 'h-4 w-4' : 'h-4 w-4'} opacity-80`} />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="text-[var(--qr-text)]">
        <DialogHeader>
          <DialogTitle>Delete all chats</DialogTitle>
          <DialogDescription className="text-[color:var(--qr-subtle)]">
            This will permanently delete all your chats and their messages. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDeleteAll} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete All'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
