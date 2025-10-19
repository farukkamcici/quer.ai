"use client";

import { useEffect, useState } from "react";
import NewChatButton from "@/components/chat/NewChatButton";
import ChatList from "@/components/chat/ChatList";
import { GripVertical } from "lucide-react";
import { Surface } from "@/components/brand/Surface";

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
          {!isCollapsed && (
            <h2 className="text-xs font-semibold tracking-wide text-[var(--qr-text)]/70">Chats</h2>
          )}
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
