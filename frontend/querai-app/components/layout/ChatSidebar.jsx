"use client";

import { useEffect, useState } from "react";
import NewChatButton from "@/components/chat/NewChatButton";
import ChatList from "@/components/chat/ChatList";
import { GripVertical } from "lucide-react";

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
      <div className={`relative ${isCollapsed ? 'mx-2' : 'mx-3'} flex h-full flex-col rounded-3xl border border-white/25 dark:border-white/10 bg-gradient-to-br from-white/35 via-sky-100/30 to-white/20 dark:from-white/10 dark:via-cyan-200/10 dark:to-white/5 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-white/40 dark:ring-white/10 overflow-hidden`}>
        {/* Glass overlays */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/60 via-sky-50/20 to-transparent opacity-70" />
        <div className="pointer-events-none absolute inset-px rounded-2xl ring-1 ring-white/50 dark:ring-white/10" />

        {/* Header */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'px-2 py-3' : 'px-4 py-4'} border-b border-white/20 dark:border-white/5`}>
          {!isCollapsed && (
            <h2 className="text-xs font-semibold tracking-wide text-sky-900/70 dark:text-sky-100/80">Chats</h2>
          )}
        </div>

        {/* Content */}
        <div className={`relative flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <ChatList isCollapsed={isCollapsed} />
        </div>

        {/* Footer (New Chat) */}
        <div className={`relative flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-white/20 dark:border-white/5`}>
          {isCollapsed ? (
            <NewChatButton compact />
          ) : (
            <NewChatButton />
          )}
        </div>
      </div>

      {/* Edge-centered toggle button (drag-like pill slightly outside) */}
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 inline-flex h-16 w-8 items-center justify-center rounded-full border border-white/40 bg-white/30 text-neutral-800 shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-white/40 dark:border-white/10 dark:bg-white/10 dark:text-neutral-100 cursor-pointer backdrop-blur-md"
        title={isCollapsed ? "Expand" : "Collapse"}
        aria-pressed={isCollapsed}
      >
        <GripVertical className="h-5 w-5 opacity-70" />
      </button>
    </aside>
  );
}
