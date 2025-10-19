"use client";

import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  currentChatId: null,
  currentMessages: [],
  currentDataSourceId: null,

  setDataSource: (id) => set({ currentDataSourceId: id || null }),
  setChatId: (id) => {
    const next = id || null;
    try {
      if (next) localStorage.setItem('currentChatId', next);
      else localStorage.removeItem('currentChatId');
    } catch {}
    set({ currentChatId: next });
  },
  resetChat: () => {
    try { localStorage.removeItem('currentChatId'); } catch {}
    set({ currentMessages: [] });
  },
  addMessage: (msg) => set((s) => ({ currentMessages: [...s.currentMessages, msg] })),
  setMessages: (msgs) => set({ currentMessages: Array.isArray(msgs) ? msgs : [] }),
}));
